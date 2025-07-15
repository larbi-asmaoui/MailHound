package api

import (
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SingleExtractHandler(c *gin.Context) {
	type Request struct {
		Website string `json:"website" binding:"required"`
	}

	var req Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Le champ 'website' est requis / حقل 'الموقع الإلكتروني' مطلوب",
		})
		return
	}

	emails, err := service.ExtractEmailsFromSiteFast(req.Website)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Erreur lors de l'extraction / خطأ أثناء الاستخراج",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"emails": emails,
	})
}
