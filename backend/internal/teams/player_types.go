package teams

type TeamPlayerDetail struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	DisplayName *string `json:"displayName"`
	FirstName   *string `json:"firstName"`
	LastName    *string `json:"lastName"`
	Age         *int    `json:"age"`
	Number      *int    `json:"number"`
	Position    *string `json:"position"`
	PhotoURL    *string `json:"photoUrl"`
	BirthPlace  *string `json:"birthPlace"`
	BirthDate   *string `json:"birthDate"`
	Height      *string `json:"height"`
	Weight      *string `json:"weight"`
	Provider    string  `json:"provider"`
}
