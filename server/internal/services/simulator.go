package services

import (
	"fmt"
	"math"
	"time"
)

// Port of Mulberry32 PRNG from src/engine/prng.ts
func mulberry32(seed int32) func() float64 {
	state := seed
	return func() float64 {
		state = state + 0x6D2B79F5
		t := int64(state)
		t = int64(int32(t ^ (t >> 15))) * int64(int32(1 | int64(state)))
		t = int64(int32(t ^ (t >> 7))) * int64(int32(61 | t))
		t = t ^ (t >> 14)
		return float64(uint32(t)) / 4294967296.0
	}
}

func d100(rand func() float64) int {
	return int(math.Floor(rand() * 100))
}

// --- Simulator Types ---

type SimDriver struct {
	ID         string
	Speed      float64
	Control    float64
	Aggression float64
	Reputation float64
	Name       string
}

type SimCar struct {
	ID          string
	TopSpeed    float64
	Control     float64
	Aggression  float64
	Durability  float64
}

type SimDistrict struct {
	ID         string
	Name       string
	HazardList []string
}

type RaceSetupInput struct {
	ID              string   `json:"id"`
	DistrictID      string   `json:"districtId"`
	Stakes          string   `json:"stakes"`
	Posture         string   `json:"posture"`
	Length          string   `json:"length"`
	PlayerCarIDs    []string `json:"playerCarIds"`
	PlayerDriverIDs []string `json:"playerDriverIds"`
	Seed            int32    `json:"seed"`
}

type RaceEvent struct {
	Tick     int      `json:"tick"`
	Type     string   `json:"type"`
	Drivers  []string `json:"drivers"`
	Severity int      `json:"severity"`
	Location string   `json:"location"`
}

type RaceResult struct {
	RaceID               string                    `json:"raceId"`
	Outcome              string                    `json:"outcome"`
	Position             int                       `json:"position"`
	FinishTime           int64                     `json:"finishTime"`
	Events               []RaceEvent               `json:"events"`
	Rewards              RaceRewards               `json:"rewards"`
	DriverStatChanges    map[string]map[string]int `json:"driverStatChanges"`
	DistrictControlChange int                      `json:"districtControlChange"`
	Narrative            string                    `json:"narrative"`
}

type RaceRewards struct {
	Cash  int        `json:"cash"`
	Rep   int        `json:"rep"`
	Parts []string   `json:"parts"`
	Info  int        `json:"info"`
}

var tickCount = map[string]int{
	"5m":  20,
	"30m": 60,
	"4h":  120,
	"8h":  200,
}

// SimulateRaceInput is the full request body for the race simulation endpoint.
type SimulateRaceInput struct {
	Race     RaceSetupInput           `json:"race"`
	Drivers  map[string]SimDriver     `json:"drivers"`
	Cars     map[string]SimCar        `json:"cars"`
	District SimDistrict              `json:"district"`
}

func SimulateRace(in SimulateRaceInput) (RaceResult, error) {
	race := in.Race
	drivers := in.Drivers
	cars := in.Cars
	district := in.District

	rand := mulberry32(race.Seed)
	ticks := tickCount[race.Length]
	if ticks == 0 {
		ticks = 60
	}

	events := make([]RaceEvent, 0)

	// Build player driver/car stats
	playerDriver, hasPD := drivers[race.PlayerDriverIDs[0]]
	playerCar, hasPC := cars[race.PlayerCarIDs[0]]

	pSpeed := 30.0
	pControl := 30.0
	pAggression := 30.0
	pDurability := 50.0
	if hasPD {
		pSpeed = playerDriver.Speed
		pControl = playerDriver.Control
		pAggression = playerDriver.Aggression
	}
	if hasPC {
		pSpeed += playerCar.TopSpeed
		pControl += playerCar.Control
		pAggression += playerCar.Aggression
		pDurability = playerCar.Durability
	}

	// Rival stats
	rivalMultiplier := 1.0
	switch race.Stakes {
	case "boss":
		rivalMultiplier = 1.3
	case "high":
		rivalMultiplier = 1.1
	case "mid":
		rivalMultiplier = 0.9
	case "low":
		rivalMultiplier = 0.7
	}
	rSpeed := (40.0 + rand()*40.0) * rivalMultiplier
	rAggression := 30.0 + rand()*50.0

	// Posture modifiers
	postureAggMul := 1.0
	postureCtrlMul := 1.0
	switch race.Posture {
	case "reckless":
		postureAggMul = 1.4
		postureCtrlMul = 0.8
	case "push":
		postureAggMul = 1.1
		postureCtrlMul = 1.0
	case "safe":
		postureAggMul = 0.9
		postureCtrlMul = 1.2
	}

	effectivePAggression := pAggression * postureAggMul
	effectivePControl := pControl * postureCtrlMul

	// Hazard base
	hazardBase := float64(len(district.HazardList) * 2)

	// Track positions
	playerPos := 50.0
	rivalPos := 50.0
	playerDmg := 0.0

	for tick := 0; tick < ticks; tick++ {
		speedDiff := pSpeed - rSpeed
		playerPos += speedDiff*0.3 + (rand()-0.5)*10
		rivalPos += -speedDiff*0.3 + (rand()-0.5)*10
		playerPos = math.Max(0, math.Min(100, playerPos))
		rivalPos = math.Max(0, math.Min(100, rivalPos))

		eventChance := 3.0 + effectivePAggression*0.15 + hazardBase*0.3
		if d100(rand) < int(eventChance) {
			eventRoll := d100(rand)
			controlCheck := effectivePControl + float64(d100(rand))

			if eventRoll < 20 && controlCheck < 80 {
				crashSeverity := d100(rand)
				playerDmg += float64(crashSeverity) * 0.4
				playerPos -= 15
				events = append(events, RaceEvent{
					Tick:     tick,
					Type:     "CRASH_OUT",
					Drivers:  race.PlayerDriverIDs,
					Severity: crashSeverity,
					Location: district.Name,
				})
				if pDurability-playerDmg < 20 {
					driverName := "Driver"
					if hasPD {
						driverName = playerDriver.Name
					}
					events = append(events, RaceEvent{
						Tick:     tick,
						Type:     "MECHANICAL",
						Drivers:  race.PlayerDriverIDs,
						Severity: 80,
						Location: fmt.Sprintf("%s — %s limping to finish", district.Name, driverName),
					})
					break
				}
			} else if eventRoll < 45 && controlCheck < 100 {
				severity := d100(rand)
				if severity > 60 {
					events = append(events, RaceEvent{
						Tick:     tick,
						Type:     "CRASH_RECOVER",
						Drivers:  race.PlayerDriverIDs,
						Severity: severity,
						Location: district.Name,
					})
					playerPos -= 5
				} else {
					events = append(events, RaceEvent{
						Tick:     tick,
						Type:     "NEAR_MISS",
						Drivers:  race.PlayerDriverIDs,
						Severity: severity,
						Location: district.Name,
					})
				}
			} else if eventRoll < 70 {
				overtakeSuccess := pSpeed+effectivePAggression*0.5 > rSpeed+rAggression*0.3+30
				if overtakeSuccess {
					playerPos += 10
					events = append(events, RaceEvent{
						Tick:     tick,
						Type:     "OVERTAKE",
						Drivers:  race.PlayerDriverIDs,
						Severity: d100(rand),
						Location: district.Name,
					})
				}
			} else if eventRoll < 85 {
				playerDmg += 10
				events = append(events, RaceEvent{
					Tick:     tick,
					Type:     "MECHANICAL",
					Drivers:  race.PlayerDriverIDs,
					Severity: d100(rand),
					Location: district.Name,
				})
			}
		}
	}

	// Finish event
	events = append(events, RaceEvent{
		Tick:    ticks,
		Type:    "FINISH",
		Drivers: race.PlayerDriverIDs,
		Location: district.Name,
	})

	// Outcome
	playerAhead := playerPos > rivalPos
	margin := math.Abs(playerPos - rivalPos)
	postureLabel := "clean"
	if race.Posture == "reckless" {
		postureLabel = "wild"
	} else if race.Posture == "push" {
		postureLabel = "aggressive"
	}

	outcome := "loss"
	if playerDmg > pDurability*0.7 {
		outcome = "loss"
	} else if margin < 5 {
		outcome = "draw"
	} else if playerAhead {
		outcome = "win"
	}

	position := 3
	if outcome == "win" {
		position = 1
	} else if outcome == "draw" {
		position = 2
	}

	rewardMult := 1
	switch race.Stakes {
	case "low":
		rewardMult = 1
	case "mid":
		rewardMult = 2
	case "high":
		rewardMult = 4
	case "boss":
		rewardMult = 8
	}

	driverName := "Unknown driver"
	if hasPD {
		driverName = playerDriver.Name
	}

	resultLines := map[string]string{
		"win":  fmt.Sprintf("%s takes it! A %s run through %s. Held the line.", driverName, postureLabel, district.Name),
		"loss": fmt.Sprintf("%s couldn't close the gap. %s belongs to the rivals tonight.", driverName, district.Name),
		"draw": fmt.Sprintf("Photo finish in %s. %s and the rival cross together. Dead heat.", district.Name, driverName),
	}

	cash := 0
	rep := 0
	if outcome == "win" {
		cash = 100 * rewardMult
		rep = 5 * rewardMult
	} else if outcome == "draw" {
		cash = 30 * rewardMult
		rep = 1
	}

	statChanges := make(map[string]map[string]int)
	if outcome == "win" {
		statChanges[race.PlayerDriverIDs[0]] = map[string]int{
			"speed":      1,
			"reputation": 2,
		}
	}

	districtChange := 0
	switch outcome {
	case "win":
		districtChange = 3
	case "loss":
		districtChange = -1
	}

	result := RaceResult{
		RaceID:                race.ID,
		Outcome:              outcome,
		Position:             position,
		FinishTime:           nowMillis(),
		Events:               events,
		Rewards:              RaceRewards{Cash: cash, Rep: rep, Parts: []string{}, Info: int(rand()*3) + 1},
		DriverStatChanges:    statChanges,
		DistrictControlChange: districtChange,
		Narrative:            resultLines[outcome],
	}

	return result, nil
}

func nowMillis() int64 {
	return time.Now().UnixMilli()
}
