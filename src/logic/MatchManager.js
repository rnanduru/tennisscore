export const PLAYER_COUNT = {
  TWO: 2,
  FOUR: 4,
};

export class MatchManager {
  constructor(team1Names, team2Names) {
    this.team1Names = team1Names; // Array of strings
    this.team2Names = team2Names; // Array of strings
    // No totalSets anymore.

    // Score State
    this.team1Points = 0;
    this.team2Points = 0;
    this.team1Games = 0;
    this.team2Games = 0;
    this.team1Sets = 0;
    this.team2Sets = 0;

    // Set History for display (Array of objects like {team1: 6, team2: 4})
    this.setsHistory = [];

    this.winner = null; // Maybe we never set this if sets are infinite, or add a manual "End Match"

    // Callback to notify UI of updates
    this.onUpdate = null;
  }

  setUpdateCallback(callback) {
    this.onUpdate = callback;
  }

  notify() {
    if (this.onUpdate) {
      this.onUpdate({ ...this });
    }
  }

  // Getters for display
  getTeam1Name() {
    return this.team1Names.join(" & ");
  }

  getTeam2Name() {
    return this.team2Names.join(" & ");
  }

  displayScore(points) {
    switch (points) {
      case 0: return "0";
      case 1: return "15";
      case 2: return "30";
      case 3: return "40";
      case 4: return "Ad";
      default: return "";
    }
  }

  // Logic to determine if a team is at Set Point
  isSetPoint(teamIndex) {
    // Logic:
    // 1. Current Game Score must be such that one more point wins the game.
    // 2. AND Winning this game must be enough to win the set.

    let sp, op;
    if (teamIndex === 1) {
      sp = this.team1Points;
      op = this.team2Points;
    } else {
      sp = this.team2Points;
      op = this.team1Points;
    }

    // Check if one point away from winning game
    let onePointFromGame = false;
    if (sp === 3 && op < 3) onePointFromGame = true; // 40-0, 40-15, 40-30
    if (sp === 4 && op === 3) onePointFromGame = true; // Advantage

    if (!onePointFromGame) return false;

    // Check if winning game wins set
    let sg, og;
    if (teamIndex === 1) {
      sg = this.team1Games;
      og = this.team2Games;
    } else {
      sg = this.team2Games;
      og = this.team1Games;
    }

    // Predicted Games if point won
    let predictedSG = sg + 1;

    // Standard Set Win: >= 6 games and >= 2 diff
    if (predictedSG >= 6 && (predictedSG - og) >= 2) return true;
    if (predictedSG === 7) return true; // Tie-break scenario simplified

    return false;
  }

  addPoint(teamIndex) {
    if (this.winner) return;

    if (teamIndex === 1) {
      this.handlePoint(
        () => this.team1Points, (v) => this.team1Points = v,
        () => this.team2Points, (v) => this.team2Points = v,
        () => this.team1Games, (v) => this.team1Games = v,
        () => this.team2Games, (v) => this.team2Games = v,
        () => this.team1Sets, (v) => this.team1Sets = v,
        () => this.team2Sets, (v) => this.team2Sets = v,
        1
      );
    } else {
      this.handlePoint(
        () => this.team2Points, (v) => this.team2Points = v,
        () => this.team1Points, (v) => this.team1Points = v,
        () => this.team2Games, (v) => this.team2Games = v,
        () => this.team1Games, (v) => this.team1Games = v,
        () => this.team2Sets, (v) => this.team2Sets = v,
        () => this.team1Sets, (v) => this.team1Sets = v,
        2
      );
    }
    this.notify();
  }

  removePoint(teamIndex) {
    if (this.winner) return;

    if (teamIndex === 1) {
      if (this.team1Points > 0) {
        // If we are at Advantage (4) and decrement, go to Deuce (3)
        // If we represent Deuce as 3-3, and Ad as 4-3,
        // then 4 -> 3.
        this.team1Points--;
        // Note: Logic for "Back to Deuce" from Ad is implicitly handled if 4->3
      }
    } else {
      if (this.team2Points > 0) {
        this.team2Points--;
      }
    }
    this.notify();
  }

  handlePoint(
    getScoringPoints, setScoringPoints,
    getOpponentPoints, setOpponentPoints,
    getScoringGames, setScoringGames,
    getOpponentGames, setOpponentGames,
    getScoringSets, setScoringSets,
    getOpponentSets, setOpponentSets,
    teamIndex
  ) {
    const sp = getScoringPoints();
    const op = getOpponentPoints();

    if (sp === 3 && op === 3) { // Deuce
      setScoringPoints(4); // Advantage
    } else if (sp === 4 && op === 3) { // Game
      this.winGame(getScoringGames, setScoringGames, getOpponentGames, setOpponentGames, getScoringSets, setScoringSets, getOpponentSets, setOpponentSets, teamIndex);
    } else if (sp === 3 && op === 4) { // Back to Deuce
      setOpponentPoints(3);
    } else if (sp === 3) { // 40 -> Game
      this.winGame(getScoringGames, setScoringGames, getOpponentGames, setOpponentGames, getScoringSets, setScoringSets, getOpponentSets, setOpponentSets, teamIndex);
    } else {
      setScoringPoints(sp + 1);
    }
  }

  winGame(
    getScoringGames, setScoringGames,
    getOpponentGames, setOpponentGames,
    getScoringSets, setScoringSets,
    getOpponentSets, setOpponentSets,
    teamIndex
  ) {
    this.team1Points = 0;
    this.team2Points = 0;

    let sg = getScoringGames() + 1;
    setScoringGames(sg);
    let og = getOpponentGames();

    // Dynamic sets - win set if conditions met, then start new set
    if (sg >= 6 && (sg - og) >= 2) {
      this.winSet(getScoringSets, setScoringSets, teamIndex);
    } else if (sg === 7) {
      this.winSet(getScoringSets, setScoringSets, teamIndex);
    }
  }

  winSet(getScoringSets, setScoringSets, teamIndex) {
    // Record set history
    this.setsHistory.push({
      team1: this.team1Games,
      team2: this.team2Games
    });

    let ss = getScoringSets() + 1;
    setScoringSets(ss);

    this.team1Games = 0;
    this.team2Games = 0;

    // No match winner condition anymore based on set count
    // Sets just keep accumulating
  }

  toJSON() {
    return {
      team1Names: this.team1Names,
      team2Names: this.team2Names,
      team1Points: this.team1Points,
      team2Points: this.team2Points,
      team1Games: this.team1Games,
      team2Games: this.team2Games,
      team1Sets: this.team1Sets,
      team2Sets: this.team2Sets,
      setsHistory: this.setsHistory,
      winner: this.winner
    };
  }
}
