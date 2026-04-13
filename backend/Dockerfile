# Etapa de build
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Dependencias mínimas útiles
RUN apk add --no-cache ca-certificates git

# Cache de módulos
COPY go.mod go.sum ./
RUN go mod download

# Copiar código
COPY . .

# Compilar binario estático
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/api ./cmd/api

# Etapa final liviana
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /bin/api /app/api

# Cloud Run usa PORT; EXPOSE es informativo pero útil
EXPOSE 8080

CMD ["/app/api"]