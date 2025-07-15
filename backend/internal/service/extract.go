package service

import (
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
)

// Expressions régulières pour emails et téléphones
var (
	emailRegex           = regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`)
	emailObfuscatedRegex = regexp.MustCompile(`[a-zA-Z0-9._%+\-]+(?:@|\[at\]|\(at\)|\{at\}|<at>)[a-zA-Z0-9.\-]+(?:\.|\[dot\]|\(dot\)|\{dot\}|<dot>)[a-zA-Z]{2,}`)
	phoneRegex           = regexp.MustCompile(`(?m)\b(?:\+?\d{1,3}[-.\s])?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b`)
	socialRegex          = regexp.MustCompile(`https?://(www\.)?(facebook\.com|twitter\.com|x\.com|linkedin\.com/company|instagram\.com)(/[^/?#]+)(/)?(\s|$|"|')`)
)

var forbiddenExt = []string{".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js", ".ico", ".pdf"}

// ExtractedEmail structure pour email + domaine
type ExtractedEmail struct {
	Email  string `json:"email"`
	Domain string `json:"domain"`
}

func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	if err != nil {
		return false
	}
	domain := ""
	if at := strings.LastIndex(email, "@"); at != -1 && at+1 < len(email) {
		domain = email[at+1:]
	}
	domain = strings.ToLower(domain)
	for _, ext := range forbiddenExt {
		if strings.HasSuffix(domain, ext) {
			return false
		}
	}
	return true
}

func cleanObfuscatedEmail(raw string) string {
	replacer := strings.NewReplacer(
		"[at]", "@", "(at)", "@", "{at}", "@", "<at>", "@",
		"[dot]", ".", "(dot)", ".", "{dot}", ".", "<dot>", ".",
	)
	return replacer.Replace(raw)
}

func uniqueStrings(input []string) []string {
	seen := make(map[string]struct{})
	var result []string
	for _, value := range input {
		if _, exists := seen[value]; !exists {
			seen[value] = struct{}{}
			result = append(result, value)
		}
	}
	return result
}

// ExtractEmailsFromSiteFast extrait seulement les emails et domaines de la page principale
func ExtractEmailsFromSiteFast(url string) (emails []ExtractedEmail, err error) {
	c := colly.NewCollector(
		colly.MaxDepth(1),
		colly.AllowedDomains(getDomain(url)),
		colly.Async(true),
	)
	c.SetRequestTimeout(10 * time.Second)

	foundEmails := make(map[string]struct{})

	c.OnHTML("html", func(e *colly.HTMLElement) {
		htmlText := e.DOM.Text()
		htmlRaw, _ := e.DOM.Html()
		htmlContent := htmlText + htmlRaw
		matches := emailObfuscatedRegex.FindAllString(htmlContent, -1)
		for _, raw := range matches {
			email := cleanObfuscatedEmail(raw)
			email = strings.ToLower(strings.TrimSpace(email))
			if isValidEmail(email) {
				foundEmails[email] = struct{}{}
			}
		}
	})

	err = c.Visit(url)
	if err != nil {
		return
	}
	c.Wait()

	// Unicité
	emails = make([]ExtractedEmail, 0, len(foundEmails))
	for em := range foundEmails {
		domain := ""
		if at := strings.LastIndex(em, "@"); at != -1 && at+1 < len(em) {
			domain = em[at+1:]
		}
		emails = append(emails, ExtractedEmail{Email: em, Domain: domain})
	}
	return
}

// ExtractContactsFromSite crawl plusieurs pages d'un site (profondeur 2) et extrait emails, téléphones, réseaux sociaux
func ExtractContactsFromSite(url string) (emails, phones, socials []string, err error) {
	c := colly.NewCollector(
		colly.MaxDepth(2),
		colly.AllowedDomains(getDomain(url)),
		colly.Async(true),
	)

	// Limiter le temps d'attente et le nombre de pages
	c.SetRequestTimeout(15 * time.Second)
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Parallelism: 2,
		RandomDelay: 1 * time.Second,
	})

	foundEmails := make(map[string]struct{})
	foundPhones := make(map[string]struct{})
	foundSocials := make(map[string]struct{})

	c.OnHTML("html", func(e *colly.HTMLElement) {
		htmlText := e.DOM.Text()
		htmlRaw, _ := e.DOM.Html()
		htmlContent := htmlText + htmlRaw
		for _, em := range emailRegex.FindAllString(htmlContent, -1) {
			foundEmails[em] = struct{}{}
		}
		for _, ph := range phoneRegex.FindAllString(htmlContent, -1) {
			foundPhones[ph] = struct{}{}
		}
		for _, so := range socialRegex.FindAllString(htmlContent, -1) {
			foundSocials[so] = struct{}{}
		}
	})

	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		href := e.Request.AbsoluteURL(e.Attr("href"))
		c.Visit(href)
	})

	err = c.Visit(url)
	if err != nil {
		return
	}

	c.Wait() // Attendre que le crawling soit terminé

	emails = mapKeys(foundEmails)
	phones = mapKeys(foundPhones)
	socials = mapKeys(foundSocials)
	return
}

// getDomain extrait le domaine d'une URL pour limiter le crawl
func getDomain(url string) string {
	// Simple extraction du domaine (améliorable)
	if len(url) == 0 {
		return ""
	}
	start := 0
	if idx := regexp.MustCompile(`https?://`).FindStringIndex(url); idx != nil {
		start = idx[1]
	}
	end := len(url)
	if idx := regexp.MustCompile(`/`).FindStringIndex(url[start:]); idx != nil {
		end = start + idx[0]
	}
	return url[start:end]
}

// mapKeys retourne les clés d'une map[string]struct{} sous forme de slice
func mapKeys(m map[string]struct{}) []string {
	res := make([]string, 0, len(m))
	for k := range m {
		res = append(res, k)
	}
	return res
}

func normalizeURL(u string) string {
	u = strings.Split(u, "?")[0] // remove query params
	u = strings.TrimRight(u, "/")
	return u
}
func cleanEmail(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "<>\"'()[]")
	s = strings.ToLower(s)

	// Remove surrounding non-email characters (like phone numbers or extra text)
	parts := strings.Split(s, "@")
	if len(parts) != 2 {
		return ""
	}
	local := parts[0]
	domain := parts[1]

	// Remove leading/trailing non-word chars
	local = regexp.MustCompile(`\W`).Split(local, -1)[len(regexp.MustCompile(`\W`).Split(local, -1))-1]
	domain = regexp.MustCompile(`\W`).Split(domain, -1)[0]

	return fmt.Sprintf("%s@%s", local, domain)
}
