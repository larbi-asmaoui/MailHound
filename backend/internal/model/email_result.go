package model

import (
	"time"
)

type EmailResult struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	JobID      string    `gorm:"index;type:uuid" json:"jobId"`
	Email      string    `json:"email"`
	IsValid    bool      `json:"isValid"`
	Reason     string    `json:"reason"`
	BounceType *string   `json:"bounceType,omitempty"`
	CheckedAt  time.Time `json:"checkedAt"`
	Status     string    `json:"status"`
}
