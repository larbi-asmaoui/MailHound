package api

import (
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Email verification
	r.POST("/api/verify", service.VerifyEmailHandler)

	// stats
	r.GET("/api/stats", GetDashboardStatsHandler)

	// Bulk email verification
	r.POST("/api/bulk-verify", BulkVerifyHandler)
	r.GET("/api/upload/job/:jobId/results/download", DownloadJobResultsHandler)
	r.GET("/api/upload/job/:jobId/results", GetJobResultsHandler)

	// Bulk email extractor
	r.POST("/api/bulk-extract", BulkExtractHandler)

}
