package service

import (
	"backend/internal/infra"
	"backend/internal/model"
	"time"
)

func SaveResultToDB(res EmailValidationResult) error {
	db := infra.GetDB()
	m := model.EmailResult{
		ID:         "", // Laisser GORM générer l'UUID
		JobID:      res.JobID,
		Email:      res.Email,
		IsValid:    res.IsValid,
		Reason:     res.Reason,
		BounceType: res.BounceType,
		CheckedAt:  res.CheckedAt,
	}
	return db.Create(&m).Error
}

// Récupère les résultats d'un job avec pagination et les stats globales
func GetJobResultsPaginated(jobId string, page, pageSize int) ([]EmailValidationResult, int64, int64, int64, int64, error) {
	db := infra.GetDB()
	var results []model.EmailResult
	var total, valid, invalid, acceptAll int64
	db.Model(&model.EmailResult{}).Where("job_id = ?", jobId).Count(&total)
	db.Model(&model.EmailResult{}).Where("job_id = ? AND status = ?", jobId, "valid").Count(&valid)
	db.Model(&model.EmailResult{}).Where("job_id = ? AND status = ?", jobId, "invalid").Count(&invalid)
	db.Model(&model.EmailResult{}).Where("job_id = ? AND status = ?", jobId, "accept_all").Count(&acceptAll)
	err := db.Where("job_id = ?", jobId).
		Order("checked_at ASC").
		Limit(pageSize).
		Offset((page - 1) * pageSize).
		Find(&results).Error
	if err != nil {
		return nil, 0, 0, 0, 0, err
	}
	converted := make([]EmailValidationResult, len(results))
	for i, r := range results {
		converted[i] = EmailValidationResult{
			Email:      r.Email,
			IsValid:    r.IsValid,
			Reason:     r.Reason,
			BounceType: r.BounceType,
			CheckedAt:  r.CheckedAt,
			JobID:      r.JobID,
			Status:     EmailStatus(r.Status),
		}
	}
	return converted, total, valid, invalid, acceptAll, nil
}

// Insertion en lot (batch insert) des résultats d'un job
func BatchSaveResults(results []EmailValidationResult) error {
	db := infra.GetDB()
	var toSave []model.EmailResult
	for _, r := range results {
		toSave = append(toSave, model.EmailResult{
			JobID:      r.JobID,
			Email:      r.Email,
			IsValid:    r.IsValid,
			Status:     string(r.Status),
			Reason:     r.Reason,
			BounceType: r.BounceType,
			CheckedAt:  r.CheckedAt,
		})
	}
	return db.Create(&toSave).Error
}

// Crée une entrée BulkJob et la retourne
func CreateBulkJob(fileName string, totalEmails int) model.BulkJob {
	db := infra.GetDB()
	job := model.BulkJob{
		FileName:   fileName,
		UploadedAt: time.Now(),
		// Status:          "processing",
		TotalEmails: totalEmails,
		// ProcessedEmails: 0,
	}
	db.Create(&job)
	return job
}

func GetBulkJobByID(jobId string) (model.BulkJob, error) {
	db := infra.GetDB()
	var job model.BulkJob
	err := db.Where("id = ?", jobId).First(&job).Error
	return job, err
}
