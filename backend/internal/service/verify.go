package service

import (
	"crypto/tls"
	"fmt"
	"math/rand"
	"net"
	"net/http"
	"net/mail"
	"net/smtp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type VerifyRequest struct {
	Email string `json:"email"`
}

type VerifyResponse struct {
	Email      string    `json:"email"`
	IsValid    bool      `json:"isValid"`
	Reason     string    `json:"reason"`
	CheckedAt  time.Time `json:"checkedAt"`
	BounceType *string   `json:"bounceType,omitempty"`
}

type SMTPResult struct {
	Code           int    `json:"code"`
	Message        string `json:"message"`
	IsCatchAllTest bool   `json:"isCatchAllTest,omitempty"`
}

type EmailStatus string

const (
	StatusValid     EmailStatus = "valid"
	StatusInvalid   EmailStatus = "invalid"
	StatusAcceptAll EmailStatus = "accept_all"
)

type EmailValidationResult struct {
	Email         string       `json:"email"`
	IsValid       bool         `json:"isValid"`
	IsCatchAll    bool         `json:"isCatchAll"`
	IsRoleBased   bool         `json:"isRoleBased"`
	IsDisposable  bool         `json:"isDisposable"`
	BounceType    *string      `json:"bounceType,omitempty"`
	SMTPResponses []SMTPResult `json:"smtpResponses"`
	Reason        string       `json:"reason"`
	CheckedAt     time.Time    `json:"checkedAt"`
	JobID         string       `json:"jobId"`
	Status        EmailStatus  `json:"status"`
}

func VerifyEmailHandler(c *gin.Context) {
	var req VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	checkedAt := time.Now()
	result, _ := ValidateEmailSMTP(strings.TrimSpace(req.Email))
	result.CheckedAt = checkedAt
	c.JSON(http.StatusOK, result)
}

func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func hasMX(email string) bool {
	at := strings.LastIndex(email, "@")
	if at == -1 {
		return false
	}
	domain := email[at+1:]
	mx, err := net.LookupMX(domain)
	return err == nil && len(mx) > 0
}

var disposableDomains = map[string]bool{
	"mailinator.com":   true,
	"10minutemail.com": true,
	"yopmail.com":      true,
}

func isDisposable(email string) bool {
	at := strings.LastIndex(email, "@")
	if at == -1 {
		return false
	}
	domain := strings.ToLower(email[at+1:])
	return disposableDomains[domain]
}

var roleBasedPrefixes = map[string]bool{
	"admin":   true,
	"support": true,
	"info":    true,
	"contact": true,
	"sales":   true,
}

func isRoleBased(email string) bool {
	at := strings.Index(email, "@")
	if at == -1 {
		return false
	}
	local := strings.ToLower(email[:at])
	return roleBasedPrefixes[local]
}

func ValidateEmailSMTP(email string) (EmailValidationResult, error) {
	result := EmailValidationResult{Email: email}
	result.IsRoleBased = isRoleBased(email)
	result.IsDisposable = isDisposable(email)

	if !isValidEmail(email) {
		result.IsValid = false
		result.Reason = "Invalid syntax"
		result.Status = StatusInvalid
		return result, nil
	}

	if !hasMX(email) {
		result.IsValid = false
		result.Reason = "No MX records"
		result.Status = StatusInvalid
		return result, nil
	}

	domain := strings.Split(email, "@")[1]
	mxRecords, err := net.LookupMX(domain)
	if err != nil || len(mxRecords) == 0 {
		result.IsValid = false
		result.Reason = "No MX records"
		result.Status = StatusInvalid
		return result, nil
	}

	mxHost := strings.TrimSuffix(mxRecords[0].Host, ".")
	if !strings.Contains(mxHost, ".") {
		result.IsValid = false
		result.Reason = "Invalid MX host"
		result.Status = StatusInvalid
		return result, nil
	}

	smtpRes, valid, bounce := smtpCheck(email, mxHost, false)
	result.SMTPResponses = smtpRes
	result.IsValid = valid
	if bounce != "" {
		result.BounceType = &bounce
	}

	if !valid {
		result.Reason = "SMTP rejected address"
		result.Status = StatusInvalid
		return result, nil
	}

	randomEmail := fmt.Sprintf("%s@%s", randomString(10), domain)
	catchAllRes, catchValid, _ := smtpCheck(randomEmail, mxHost, true)
	result.IsCatchAll = catchValid
	for _, r := range catchAllRes {
		r.IsCatchAllTest = true
		result.SMTPResponses = append(result.SMTPResponses, r)
	}
	if result.IsCatchAll {
		// result.IsValid = false
		result.IsValid = true
		result.Reason = "Catch-all domain (risky)"
		result.Status = StatusAcceptAll
	} else {
		result.Status = StatusValid
	}

	return result, nil
}

func smtpCheck(email, mxHost string, isCatchAll bool) ([]SMTPResult, bool, string) {
	var responses []SMTPResult

	// Dial the SMTP server
	client, err := smtp.Dial(mxHost + ":25")
	if err != nil {
		responses = append(responses, SMTPResult{Code: 0, Message: "Dial failed: " + err.Error()})
		return responses, false, ""
	}
	defer client.Close()

	// Send EHLO (extended hello)
	err = client.Hello("larbiasmaoui.com")
	if err != nil {
		responses = append(responses, SMTPResult{Code: 0, Message: "EHLO failed: " + err.Error()})
		return responses, false, ""
	}
	responses = append(responses, SMTPResult{Code: 250, Message: "EHLO accepted"})

	// Upgrade to TLS if supported
	if ok, _ := client.Extension("STARTTLS"); ok {
		config := &tls.Config{ServerName: mxHost}
		err = client.StartTLS(config)
		if err != nil {
			responses = append(responses, SMTPResult{Code: 0, Message: "STARTTLS failed: " + err.Error()})
			return responses, false, ""
		}
	}

	// Send MAIL FROM
	err = client.Mail("me@larbiasmaoui.com")
	if err != nil {
		responses = append(responses, SMTPResult{Code: 0, Message: "MAIL FROM failed: " + err.Error()})
		return responses, false, ""
	}
	responses = append(responses, SMTPResult{Code: 250, Message: "MAIL FROM accepted"})

	// Send RCPT TO
	err = client.Rcpt(email)
	if err != nil {
		msg := err.Error()
		code := 0
		if len(msg) >= 3 {
			if c, errParse := strconv.Atoi(msg[:3]); errParse == nil {
				code = c
			}
		}
		responses = append(responses, SMTPResult{Code: code, Message: msg})
		if code >= 500 && code <= 599 {
			return responses, false, "hard"
		} else if code >= 400 && code <= 499 {
			return responses, false, "soft"
		}
		return responses, false, ""
	}
	responses = append(responses, SMTPResult{Code: 250, Message: "RCPT TO accepted"})

	return responses, true, ""
}

func randomString(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyz0123456789")
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}
