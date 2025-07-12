package main

import (
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// Result holds extracted emails and phone numbers
type Result struct {
	Emails []string
	Phones []string
}

// extractEmailsAndPhones fetches a website and extracts emails and phone numbers
func extractEmailsAndPhones(url string) (Result, error) {
	// Send HTTP request
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return Result{}, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return Result{}, fmt.Errorf("failed to fetch URL %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Result{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Parse HTML with goquery
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return Result{}, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Extract all text from the page
	var text strings.Builder
	doc.Find("body").Each(func(i int, s *goquery.Selection) {
		text.WriteString(s.Text() + " ")
	})

	// Define regex patterns
	emailPattern := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	phonePattern := regexp.MustCompile(`(\+?\d{1,2}\s?)?(\(\d{3}\)\s?|\d{3}[-. ]?)?\d{3}[-. ]?\d{4}\b`)

	// Find matches
	emails := emailPattern.FindAllString(text.String(), -1)
	phonesRaw := phonePattern.FindAllString(text.String(), -1)

	// Deduplicate and clean results
	emailSet := make(map[string]struct{})
	phoneSet := make(map[string]struct{})
	for _, email := range emails {
		emailSet[email] = struct{}{}
	}
	for _, phone := range phonesRaw {
		// Clean phone number (remove spaces, dashes, dots)
		cleaned := strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(phone, " ", ""), "-", ""), ".", "")
		phoneSet[cleaned] = struct{}{}
	}

	// Convert sets to slices
	result := Result{
		Emails: make([]string, 0, len(emailSet)),
		Phones: make([]string, 0, len(phoneSet)),
	}
	for email := range emailSet {
		result.Emails = append(result.Emails, email)
	}
	for phone := range phoneSet {
		result.Phones = append(result.Phones, phone)
	}

	return result, nil
}

func main() {
	// Example website URL (replace with target website)
	url := "https://snov.io/"

	// Extract emails and phone numbers
	result, err := extractEmailsAndPhones(url)
	if err != nil {
		log.Fatalf("Error: %v", err)
	}

	// Print results
	fmt.Println("Extracted Emails:")
	for _, email := range result.Emails {
		fmt.Printf("  - %s\n", email)
	}

	fmt.Println("\nExtracted Phone Numbers:")
	for _, phone := range result.Phones {
		fmt.Printf("  - %s\n", phone)
	}
}
