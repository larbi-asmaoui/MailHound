package api

import (
	"backend/internal/service"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type BulkVerifyResponse struct {
	JobID string `json:"jobId"`
	// Results []service.EmailValidationResult `json:"results"`

}

func BulkVerifyHandler(c *gin.Context) {
	// Use number of CPUs to optimize workers for IO-bound tasks
	numWorkers := runtime.NumCPU() * 4

	// 1. Get file
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot open file"})
		return
	}
	defer file.Close()

	// 2. Get email column name
	emailCol := c.PostForm("emailCol")
	if emailCol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "emailCol is required"})
		return
	}

	// 3. Read CSV header
	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	headers, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read CSV header"})
		return
	}

	colIndex := -1
	for i, h := range headers {
		if strings.EqualFold(strings.TrimSpace(h), strings.TrimSpace(emailCol)) {
			colIndex = i
			break
		}
	}
	if colIndex == -1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email column not found"})
		return
	}

	// 4. Extract emails
	emails := []string{}
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil || colIndex >= len(record) {
			continue
		}
		email := strings.TrimSpace(record[colIndex])
		if email != "" {
			emails = append(emails, email)
		}
	}
	if len(emails) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no valid emails found"})
		return
	}

	// 5. Create job record
	job := service.CreateBulkJob(fileHeader.Filename, len(emails))
	jobID := job.ID

	// 6. Setup worker pool and channels
	type Job struct {
		Index int
		Email string
	}
	emailCh := make(chan Job, len(emails))
	resultCh := make(chan service.EmailValidationResult, len(emails))
	var wg sync.WaitGroup

	// 7. Start worker goroutines
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range emailCh {
				start := time.Now()
				var res service.EmailValidationResult
				var err error
				for retry := 0; retry < 3; retry++ {
					res, err = service.ValidateEmailSMTP(job.Email)
					if err == nil {
						break
					}
					time.Sleep(10 * time.Second)
				}
				res.Email = job.Email
				res.JobID = jobID
				res.CheckedAt = start
				resultCh <- res
			}
		}()
	}

	// 8. Send jobs to channel
	go func() {
		for i, email := range emails {
			emailCh <- Job{Index: i, Email: email}
		}
		close(emailCh)
	}()

	// 9. Close result channel when all workers are done
	go func() {
		wg.Wait()
		close(resultCh)
	}()

	// 10. Collect results
	finalResults := []service.EmailValidationResult{}
	for res := range resultCh {
		finalResults = append(finalResults, res)
	}

	// 11. Batch save to DB in chunks
	const batchSize = 500
	for i := 0; i < len(finalResults); i += batchSize {
		end := i + batchSize
		if end > len(finalResults) {
			end = len(finalResults)
		}
		if err := service.BatchSaveResults(finalResults[i:end]); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save results"})
			return
		}
	}

	// 12. Respond
	c.JSON(http.StatusOK, BulkVerifyResponse{JobID: jobID})
}

// GET paginated results of a job
func GetJobResultsHandler(c *gin.Context) {
	jobId := c.Param("jobId")
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if ps := c.Query("pageSize"); ps != "" {
		fmt.Sscanf(ps, "%d", &pageSize)
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 500 {
		pageSize = 20
	}

	results, total, valid, invalid, acceptAll, err := service.GetJobResultsPaginated(jobId, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	job, err := service.GetBulkJobByID(jobId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"jobId":     jobId,
		"fileName":  job.FileName,
		"results":   results,
		"total":     total,
		"valid":     valid,
		"invalid":   invalid,
		"acceptAll": acceptAll,
		"page":      page,
		"pageSize":  pageSize,
	})
}

// func DownloadJobResultsHandler(c *gin.Context) {
// 	jobId := c.Param("jobId")
// 	typ := c.Query("type") // valid, invalid, accept_all, all
// 	db := infra.GetDB()
// 	var results []model.EmailResult
// 	q := db.Where("job_id = ?", jobId)
// 	if typ != "" && typ != "all" {
// 		q = q.Where("status = ?", typ)
// 	}
// 	q.Order("checked_at ASC").Find(&results)

// 	b := &bytes.Buffer{}
// 	w := csv.NewWriter(b)
// 	w.Write([]string{"Email", "Status"})
// 	for _, r := range results {
// 		w.Write([]string{r.Email, r.Status})
// 	}
// 	w.Flush()

//		c.Header("Content-Type", "text/csv")
//		c.Header("Content-Disposition", "attachment; filename=results-"+jobId+"-"+typ+".csv")
//		c.String(200, b.String())
//	}
// func GetResultsForDownload(jobId, typ string) []model.EmailResult {
// 	db := infra.GetDB()
// 	var results []model.EmailResult
// 	q := db.Where("job_id = ?", jobId)
// 	if typ != "" && typ != "all" {
// 		q = q.Where("status = ?", typ)
// 	}
// 	q.Order("checked_at ASC").Find(&results)
// 	return results
// }
