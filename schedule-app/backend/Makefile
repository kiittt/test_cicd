GO ?= go
GOPROXY ?= https://goproxy.cn,direct

.PHONY: fmt fmt-check vet test quality

fmt:
	gofmt -w ./cmd ./internal

fmt-check:
	@test -z "$$(gofmt -l ./cmd ./internal)" || (gofmt -l ./cmd ./internal && exit 1)

vet:
	GOPROXY=$(GOPROXY) $(GO) vet ./...

test:
	GOPROXY=$(GOPROXY) $(GO) test ./...

quality: fmt-check vet test
