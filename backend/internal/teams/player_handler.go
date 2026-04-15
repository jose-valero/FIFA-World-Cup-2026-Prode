package teams

import (
	"encoding/json"
	"net/http"
	"strings"
)

func (h *Handler) GetPlayerDetail(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/teams/")
	parts := strings.Split(path, "/")

	if len(parts) < 4 || parts[1] != "players" || parts[3] != "detail" {
		http.Error(w, "invalid player detail route", http.StatusBadRequest)
		return
	}

	teamID := parts[0]
	playerID := parts[2]

	detail, err := h.service.GetPlayerDetail(r.Context(), teamID, playerID)
	if err != nil {
		switch err {
		case ErrTeamNotFound, ErrPlayerNotFound:
			http.Error(w, err.Error(), http.StatusNotFound)
		default:
			http.Error(w, "internal error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(detail)
}
