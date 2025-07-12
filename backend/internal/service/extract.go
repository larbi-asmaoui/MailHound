package service

import (
	"regexp"

	"github.com/gocolly/colly/v2"
)

// Expressions régulières pour emails et téléphones
var (
	emailRegex  = regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}`)
	phoneRegex  = regexp.MustCompile(`\\+?\\d[\\d\\s\\-()]{7,}\\d`)
	socialRegex = regexp.MustCompile(`https?://(www\\.)?(facebook|twitter|linkedin|instagram)\\.com/[^"'\\s]+`)
)

// ExtractContactsFromSite crawl plusieurs pages d'un site (profondeur 2) et extrait emails, téléphones, réseaux sociaux
func ExtractContactsFromSite(url string) (emails, phones, socials []string, err error) {
	c := colly.NewCollector(
		colly.MaxDepth(2),
		colly.AllowedDomains(getDomain(url)),
	)
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
