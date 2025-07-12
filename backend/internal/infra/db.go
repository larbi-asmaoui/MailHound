package infra

import (
	"log"
	"sync"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB
var once sync.Once

func GetDB() *gorm.DB {
	once.Do(func() {
		// dsn := os.Getenv("DATABASE_URL")
		// if dsn == "" {
		dsn := "host=localhost user=postgres password=postgres dbname=emailverifier1 port=5432 sslmode=disable"
		// }
		var err error
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})

		if err != nil {
			log.Fatalf("failed to connect to db: %v", err)
		}
	})
	return db
}
