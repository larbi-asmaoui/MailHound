package api

import (
	"backend/internal/service"
	"encoding/csv"
	"io"
	"net/http"
	"runtime"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

type BulkExtractResult struct {
	Site   string `json:"site"`
	Email  string `json:"email"`
	Domain string `json:"domain"`
}

func BulkExtractHandler(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Le fichier est requis / الملف مطلوب"})
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Impossible d'ouvrir le fichier / لا يمكن فتح الملف"})
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	headers, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Impossible de lire l'en-tête du CSV / لا يمكن قراءة رأس ملف CSV"})
		return
	}

	websiteCol := c.PostForm("websiteCol")
	if websiteCol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Le nom de la colonne du site web est requis / اسم عمود الموقع الإلكتروني مطلوب"})
		return
	}
	colIndex := -1
	for i, h := range headers {
		if strings.EqualFold(strings.TrimSpace(h), strings.TrimSpace(websiteCol)) {
			colIndex = i
			break
		}
	}
	if colIndex == -1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Colonne du site web non trouvée / لم يتم العثور على عمود الموقع الإلكتروني"})
		return
	}

	websites := []string{}
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil || colIndex >= len(record) {
			continue
		}
		website := strings.TrimSpace(record[colIndex])
		if website != "" {
			websites = append(websites, website)
		}
	}
	if len(websites) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Aucun site web valide trouvé / لم يتم العثور على مواقع إلكترونية صالحة"})
		return
	}

	numWorkers := runtime.NumCPU() * 4
	type Job struct {
		Index   int
		Website string
	}

	type EmailResult struct {
		Site   string
		Email  string
		Domain string
	}

	jobCh := make(chan Job, len(websites))
	resultCh := make(chan []EmailResult, len(websites))
	var wg sync.WaitGroup

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobCh {
				emails, err := service.ExtractEmailsFromSiteFast(job.Website)
				results := []EmailResult{}
				if err == nil {
					for _, em := range emails {
						results = append(results, EmailResult{
							Site:   job.Website,
							Email:  em.Email,
							Domain: em.Domain,
						})
					}
				}
				resultCh <- results
			}
		}()
	}

	go func() {
		for i, website := range websites {
			jobCh <- Job{Index: i, Website: website}
		}
		close(jobCh)
	}()

	go func() {
		wg.Wait()
		close(resultCh)
	}()

	allResults := []BulkExtractResult{}
	for res := range resultCh {
		for _, r := range res {
			allResults = append(allResults, BulkExtractResult(r))
		}
	}

	c.JSON(http.StatusOK, gin.H{"results": allResults})
}
