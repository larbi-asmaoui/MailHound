package main

import (
	"backend/internal/api"
	"backend/internal/infra"
	"backend/internal/model"

	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true

	r.Use(cors.New(config))

	// Auto-migration des tables (dev)
	db := infra.GetDB()
	db.AutoMigrate(&model.BulkJob{}, &model.EmailResult{})

	api.RegisterRoutes(r)

	r.Run(":3009")
	go http.ListenAndServe("localhost:6060", nil)
}
