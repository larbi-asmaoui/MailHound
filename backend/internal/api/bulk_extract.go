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

	"github.com/gin-gonic/gin"
)

func BulkExtractHandler(c *gin.Context) {
	// Récupérer le fichier CSV uploadé
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

	// Lire l'en-tête du CSV
	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	headers, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Impossible de lire l'en-tête du CSV / لا يمكن قراءة رأس ملف CSV"})
		return
	}

	// Trouver la colonne du site web
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

	// Extraire les URLs des sites web
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

	// Lancer l'extraction en parallèle
	numWorkers := runtime.NumCPU() * 4
	type Job struct {
		Index   int
		Website string
	}
	type Result struct {
		Index   int
		Website string
		Emails  []string
		Phones  []string
		Socials []string
		Error   string
	}
	jobCh := make(chan Job, len(websites))
	resultCh := make(chan Result, len(websites))
	var wg sync.WaitGroup

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobCh {
				emails, phones, socials, err := service.ExtractContactsFromSite(job.Website)
				res := Result{
					Index:   job.Index,
					Website: job.Website,
					Emails:  emails,
					Phones:  phones,
					Socials: socials,
				}
				if err != nil {
					res.Error = fmt.Sprintf("Erreur: %v / خطأ: %v", err, err)
				}
				resultCh <- res
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

	// Collecter les résultats
	results := make([]Result, len(websites))
	for res := range resultCh {
		results[res.Index] = res
	}

	// Générer un CSV de sortie
	var output strings.Builder
	writer := csv.NewWriter(&output)
	writer.Write([]string{"Website", "Emails", "Phones", "Socials", "Error"})
	for _, r := range results {
		writer.Write([]string{
			r.Website,
			strings.Join(r.Emails, "; "),
			strings.Join(r.Phones, "; "),
			strings.Join(r.Socials, "; "),
			r.Error,
		})
	}
	writer.Flush()

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=bulk_extract_results.csv")
	c.String(http.StatusOK, output.String())
}
