package teams

func ResolveConfederation(teamCode *string) TeamConfederation {
	if teamCode == nil {
		return TeamConfederation{}
	}

	switch *teamCode {
	case "ARG", "BRA", "PAR", "ECU", "URU", "COL":
		code := "CONMEBOL"
		label := "Conmebol"
		return TeamConfederation{Code: &code, Label: &label}
	case "MEX", "CAN", "USA", "CUW", "HAI", "PAN":
		code := "CONCACAF"
		label := "Concacaf"
		return TeamConfederation{Code: &code, Label: &label}
	case "RSA", "MAR", "CIV", "EGY", "SEN", "ALG", "COD", "GHA", "CPV":
		code := "CAF"
		label := "CAF"
		return TeamConfederation{Code: &code, Label: &label}
	case "KOR", "QAT", "JPN", "KSA", "IRQ", "JOR", "UZB", "IRN", "AUS":
		code := "AFC"
		label := "AFC"
		return TeamConfederation{Code: &code, Label: &label}
	case "NZL":
		code := "OFC"
		label := "OFC"
		return TeamConfederation{Code: &code, Label: &label}
	default:
		code := "UEFA"
		label := "UEFA"
		return TeamConfederation{Code: &code, Label: &label}
	}
}
