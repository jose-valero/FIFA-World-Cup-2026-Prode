package apisports

type TeamsResponse struct {
	Response []TeamSearchResult `json:"response"`
}

type TeamSearchResult struct {
	Team struct {
		ID       int     `json:"id"`
		Name     string  `json:"name"`
		Code     *string `json:"code"`
		Country  *string `json:"country"`
		Founded  *int    `json:"founded"`
		National *bool   `json:"national"`
		Logo     *string `json:"logo"`
	} `json:"team"`
	Venue struct {
		Name *string `json:"name"`
		City *string `json:"city"`
	} `json:"venue"`
}

type SquadResponse struct {
	Response []SquadResult `json:"response"`
}

type SquadResult struct {
	Team struct {
		ID   int     `json:"id"`
		Name string  `json:"name"`
		Logo *string `json:"logo"`
	} `json:"team"`
	Players []SquadPlayer `json:"players"`
}

type SquadPlayer struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Age      *int    `json:"age"`
	Number   *int    `json:"number"`
	Position *string `json:"position"`
	Photo    *string `json:"photo"`
}
