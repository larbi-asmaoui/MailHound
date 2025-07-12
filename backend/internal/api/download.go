package api

import (
	"backend/internal/service"
	"backend/internal/util"

	"github.com/gin-gonic/gin"
)

func DownloadJobResultsHandler(c *gin.Context) {
	jobId := c.Param("jobId")
	typ := c.Query("type")
	results := service.GetResultsForDownload(jobId, typ)
	csvData := util.GenerateCSV(results)
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=results-"+jobId+"-"+typ+".csv")
	c.String(200, csvData)
}
