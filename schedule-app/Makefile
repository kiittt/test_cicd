API_BASE_URL ?= http://localhost:8080

.PHONY: frontend-quality backend-quality api-test e2e-test quality

frontend-quality:
	cd frontend && npm run format:check
	cd frontend && npm run lint
	cd frontend && npm run test
	cd frontend && npm run build

backend-quality:
	cd backend && $(MAKE) quality

api-test:
	cd frontend && API_BASE_URL=$(API_BASE_URL) npm run test:api

e2e-test:
	cd frontend && npm run test:e2e

quality: backend-quality frontend-quality api-test e2e-test
