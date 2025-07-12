package service

import (
	"backend/internal/infra"
	"backend/internal/model"
	"time"
)

type DashboardStats struct {
	TotalToday int64
	TotalAll   int64
	Good       int64
	Risky      int64
	Invalid    int64
}

func GetDashboardStats() (DashboardStats, error) {
	db := infra.GetDB()
	var stats DashboardStats

	// Total emails verified today
	today := time.Now().Truncate(24 * time.Hour)
	db.Model(&model.EmailResult{}).Where("checked_at >= ?", today).Count(&stats.TotalToday)

	// Total emails verified (all time)
	db.Model(&model.EmailResult{}).Count(&stats.TotalAll)

	// Total good emails
	db.Model(&model.EmailResult{}).Where("status = ?", "valid").Count(&stats.Good)

	// Total risky emails
	db.Model(&model.EmailResult{}).Where("status = ?", "accept_all").Count(&stats.Risky)

	// Total invalid emails
	db.Model(&model.EmailResult{}).Where("status = ?", "invalid").Count(&stats.Invalid)

	return stats, nil
}
