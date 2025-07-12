package api

import (
	"backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetDashboardStatsHandler(c *gin.Context) {
	stats, err := service.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des statistiques"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}
