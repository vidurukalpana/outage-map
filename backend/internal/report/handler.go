package report

import (
	"encoding/json"
	"log"
	"net/http"

	"outage-map/backend/internal/httpx"
)

type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	report, err := ValidateCreate(req, r.Header.Get("X-Device-Id"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	id, err := h.store.Create(r.Context(), report)
	if err != nil {
		log.Printf("create report: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "could not save report")
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]string{"id": id})
}

func (h *Handler) Clusters(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	bbox, err := ParseBBox(q.Get("bbox"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	types, err := ParseTypes(q.Get("types"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	clusters, err := h.store.Clusters(r.Context(), bbox, types)
	if err != nil {
		log.Printf("list clusters: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "could not load clusters")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, clusters)
}
