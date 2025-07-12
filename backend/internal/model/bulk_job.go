package model

import (
	"time"
)

// / Modèle pour l'historique des jobs bulk
// (à migrer avec GORM)
type BulkJob struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	FileName   string    `json:"fileName"`
	UploadedAt time.Time `json:"uploadedAt"`
	// Status          string    `json:"status"`
	TotalEmails int `json:"totalEmails"`
	// ProcessedEmails int `json:"processedEmails"`
	// ResultsJSON datatypes.JSON `gorm:"type:jsonb"` // Optional
}
