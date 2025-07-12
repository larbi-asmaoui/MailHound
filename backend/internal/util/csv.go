package util

import (
	"backend/internal/model"
	"bytes"
	"encoding/csv"
)

func GenerateCSV(results []model.EmailResult) string {
	b := &bytes.Buffer{}
	w := csv.NewWriter(b)
	w.Write([]string{"Email", "Status", "Reason", "CheckedAt"})
	for _, r := range results {
		w.Write([]string{r.Email, r.Status, r.Reason, r.CheckedAt.Format("2006-01-02 15:04:05")})
	}
	w.Flush()
	return b.String()
}
