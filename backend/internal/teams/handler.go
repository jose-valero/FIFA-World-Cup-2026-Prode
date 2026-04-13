package teams

import (
	"encoding/json"
	"net/http"
	"strings"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetTeamDetail(w http.ResponseWriter, r *http.Request) {
	teamID := strings.TrimPrefix(r.URL.Path, "/api/v1/teams/")
	teamID = strings.TrimSuffix(teamID, "/detail")

	if teamID == "" {
		http.Error(w, "missing team id", http.StatusBadRequest)
		return
	}

	detail, err := h.service.GetTeamDetail(r.Context(), teamID)
	if err != nil {
		switch err {
		case ErrTeamNotFound:
			http.Error(w, "team not found", http.StatusNotFound)
		default:
			http.Error(w, "internal error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(detail)
}
