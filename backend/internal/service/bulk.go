package service

import (
	"backend/internal/infra"
	"backend/internal/model"
)

func GetResultsForDownload(jobId, typ string) []model.EmailResult {
	db := infra.GetDB()
	var results []model.EmailResult
	q := db.Where("job_id = ?", jobId)
	if typ != "" && typ != "all" {
		q = q.Where("status = ?", typ)
	}
	q.Order("checked_at ASC").Find(&results)
	return results
}
