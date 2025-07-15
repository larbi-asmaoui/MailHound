package main

import (
	"fmt"
	"regexp"
)

// isValidPhoneNumber valide si une chaîne ressemble vraiment à un numéro de téléphone
func isValidPhoneNumber(phone string) bool {
	// Nettoyer le numéro
	clean := regexp.MustCompile(`[^\d+]`).ReplaceAllString(phone, "")

	// Vérifier la longueur (7-15 chiffres pour un téléphone international)
	if len(clean) < 7 || len(clean) > 15 {
		return false
	}

	// Vérifier qu'il y a au moins 7 chiffres consécutifs
	digits := regexp.MustCompile(`\d+`).FindAllString(clean, -1)
	totalDigits := 0
	for _, d := range digits {
		totalDigits += len(d)
	}

	// Doit avoir au moins 7 chiffres
	if totalDigits < 7 {
		return false
	}

	// Éviter les séquences répétitives (comme 1111111)
	if len(digits) > 0 {
		firstDigit := rune(digits[0][0])
		allSame := true
		for _, d := range digits {
			for _, c := range d {
				if rune(c) != firstDigit {
					allSame = false
					break
				}
			}
		}
		if allSame && totalDigits > 7 {
			return false
		}
	}

	// Éviter les séquences qui ressemblent à des dates (YYYY-MM-DD ou MM-DD-YYYY)
	datePattern := regexp.MustCompile(`^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{4}$`)
	if datePattern.MatchString(phone) {
		return false
	}

	// Éviter les séquences qui commencent par des patterns non-téléphoniques
	// IDs longs (9+ chiffres consécutifs sans séparateurs)
	if len(clean) >= 9 {
		// Vérifier si c'est un ID (trop de chiffres consécutifs)
		consecutiveDigits := 0
		maxConsecutive := 0
		for _, c := range clean {
			if c >= '0' && c <= '9' {
				consecutiveDigits++
				if consecutiveDigits > maxConsecutive {
					maxConsecutive = consecutiveDigits
				}
			} else {
				consecutiveDigits = 0
			}
		}

		// Si on a plus de 8 chiffres consécutifs, c'est probablement un ID
		if maxConsecutive > 8 {
			return false
		}
	}

	// Vérifier les patterns de téléphone valides
	// Formats acceptés: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890
	phonePatterns := []string{
		`^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$`, // US format
		`^\+?[0-9]{1,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}$`,          // International
		`^[0-9]{7,8}$`, // Simple 7-8 digits
	}

	for _, pattern := range phonePatterns {
		if regexp.MustCompile(pattern).MatchString(phone) {
			return true
		}
	}

	// Si aucun pattern ne correspond, c'est probablement pas un téléphone
	return false
}

func main() {
	testNumbers := []string{
		"179268733",       // ID - devrait être false
		"1010044",         // ID - devrait être false
		"1747178032",      // ID - devrait être false
		"(555) 123-4567",  // Téléphone valide - devrait être true
		"555-123-4567",    // Téléphone valide - devrait être true
		"+1 555 123 4567", // Téléphone valide - devrait être true
		"2021-08-28",      // Date - devrait être false
		"1234567890",      // 10 chiffres consécutifs - devrait être false
		"555-1234",        // Téléphone court - devrait être true
	}

	fmt.Println("Test de validation des numéros de téléphone:")
	fmt.Println("==========================================")

	for _, num := range testNumbers {
		result := isValidPhoneNumber(num)
		status := "❌"
		if result {
			status = "✅"
		}
		fmt.Printf("%s %s: %t\n", status, num, result)
	}
}
