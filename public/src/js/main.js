/* eslint semi: ["error", "always", { "omitLastInOneLineBlock": true}] */
/* eslint space-before-function-paren: "off" */

/* Inclusive of both lower and upper
 * - Ex: randomInteger(0, 2) could yield any of [0, 1, 2]
 */
const randomInteger = (lower, upper) => {
  return lower + Math.floor(Math.random() * (upper - lower + 1));
};

/* Non-inclusive of upper
 * - Ex: randomIntegerUpTo(3) could yield any of [0, 1, 2]
 */
const randomIntegerUpTo = (upper) => {
  return randomInteger(0, upper - 1);
};

class Card {
  constructor(face, suit) {
    this.face = face;
    this.suit = suit;
  }

  longName() {
    return `${this.face} of ${this.suit}`;
  }

  score() {
    if (this.face === 'Ace') {
      return 11;
    } else if (['10', 'Jack', 'Queen', 'King'].includes(this.face)) {
      return 10;
    } else {
      return parseInt(this.face);
    }
  }

  html() {
    return `<h4 class="playing-card">${this.face} of ${this.suit}</h4>`;
  }
}
Card.suits = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
Card.faces = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
Card.randomCard = () => {
  const suit = Card.suits[randomIntegerUpTo(Card.suits.length)];
  const face = Card.faces[randomIntegerUpTo(Card.faces.length)];
  return new Card(face, suit);
};

class Deck {
  /* If deckCount is 0 or less, a `magic` deck is used.
   * - A magic deck is a deck that creates cards as needed and doesn't use a discard pile
   */
  constructor(deckCount) {
    this.drawPile = [];
    this.discardPile = [];

    // Create the decks
    for (let i = 0; i < deckCount; i++) {
      Card.suits.forEach((suit) => {
        Card.faces.forEach((face) => {
          this.drawPile.push(new Card(face, suit));
        });
      });
    }
  }

  shuffle() {
    if (this.magicDeck()) {
      return;
    }
    const newPile = [];
    const oldPile = this.drawPile.concat(this.discardPile);
    while (oldPile.length) {
      const index = randomIntegerUpTo(oldPile.length);
      const nextCard = oldPile.splice(index, 1).pop();
      newPile.push(nextCard);
    }
    this.drawPile = newPile;
  }

  draw() {
    if (this.magicDeck()) {
      return Card.randomCard();
    }
    const card = this.drawPile.pop();
    this.discardPile.push(card);
    return card;
  }

  /* Checks if the deck is a magic deck */
  magicDeck() {
    return this.drawPile.concat(this.discardPile).length === 0;
  }
}

class AbstractPlayer {
  constructor(query, innerHTML = '') {
    this.hand = [];
    let htmlTemp = document.querySelector(`#${query}`);
    if (!htmlTemp) {
      document.querySelector('#gameContainer').innerHTML +=
        `<section id="${query}" class="player-box"></section>`;
      htmlTemp = document.querySelector(`#${query}`);
      htmlTemp.innerHTML = innerHTML;
    }
    this.html = {
      base: htmlTemp,
      score: htmlTemp.querySelector('.score'),
      hand: htmlTemp.querySelector('.player-hand')
    };
  }

  deal(card) {
    this.hand.push(card);
    if (this.score() > 21) {
      game.bust(this);
    } else if (this.score() === 21) {
      game.win(this);
    }
  }

  score() {
    const scores = this.hand.map((card) => {
      return card.score();
    });
    scores.push(0); // This zero acts as a zero score guarantee
    const reducer = (a, b) => { return a + b };
    while (scores.reduce(reducer) > 21 && scores.includes(11)) {
      const index = scores.indexOf(11);
      scores[index] = 1;
    }
    return scores.reduce(reducer);
  }

  clearHand() {
    this.hand = [];
  }

  updateHtml() {
    const scoreHtml = this.html.score;
    const handHtml = this.html.hand;
    handHtml.innerHTML = '';
    scoreHtml.textContent = `Score: ${this.score()}`;
    this.hand.forEach((card) => {
      console.log(this, card);
      handHtml.innerHTML += card.html();
    });
  }
}

class Dealer extends AbstractPlayer {
  constructor() {
    super('dealerContainer');
    this.showHand = false;
  }

  updateHtml() {
    const scoreHtml = this.html.score;
    const handHtml = this.html.hand;
    handHtml.innerHTML = '';
    if (this.showHand) {
      super.updateHtml();
    } else {
      scoreHtml.textContent = 'Score: ?';
      this.hand.forEach((card) => {
        handHtml.innerHTML += '<h4 class="playing-card">?</h4>';
      });
    }
  }
}

class Player extends AbstractPlayer {
  constructor() {
    let id = Player.newId();
    super(`playerContainer${id}`, Player.innerHTML(id));
    this.id = id;
    this.winCount = 0;
    const decorate = (f) => {
      const inner = (event) => {
        event.preventDefault();
        f(event);
        this.updateHtml();
      };
      return inner;
    };
    this.html.base.querySelector('.hit-option')
      .addEventListener('click', decorate((event) => {
        game.hit(this);
      }));
    this.html.base.querySelector('.stand-option')
      .addEventListener('click', decorate((event) => {
        game.stand(this);
      }));
  }

  won() {
    this.winCount += 1;
    this.html.base.style.backgroundColor = 'green';
  }

  clearHand() {
    super.clearHand();
    this.html.base.style.backgroundColor = 'lightgrey';
  }
}
Player.id = 0;
Player.newId = () => {
  return Player.id++;
};
Player.innerHTML = (id) => {
  return `
    <header class="player-header">
      <h2 class="player-name">Player ${id}</h2>
    </header>
    <h3 class="score">Score: ?</h3>
    <ul class="player-hand">
    </ul>
    <form action="" class="player-options">
      <button class="player-option hit-option">Hit</button>
      <button class="player-option stand-option">Stand</button>
    </form>
  `;
};

class Game {
  constructor(playerCount, deckCount = 0) {
    this.dealer = new Dealer();
    this.players = [];
    this.standing = [];
    this.busted = [];
    this.winners = [];
    this.deck = new Deck(deckCount);
    this.deck.shuffle();
    for (let i = 0; i < playerCount; i++) {
      this.players.push(new Player());
    }
  }

  newGame() {
    this.dealer.showHand = false;
    this.standing = [];
    this.busted = [];
    this.winners = [];
    [this.dealer].concat(this.players).forEach((player) => {
      console.log(player);
      player.clearHand();
      for (let i = 0; i < 2; i++) {
        player.deal(this.deck.draw());
      }
      player.updateHtml();
    });
  }

  startAi() {
    const dealer = this.dealer;
    const players = this.players;
    dealer.showHand = true;
    dealer.updateHtml();
    while (dealer.score() < 18) {
      dealer.deal(this.deck.draw());
      dealer.updateHtml();
    }
    if (dealer.score() > 21) { // Dealer bust
      this.winners = players.filter((player) => {
        if (player.score() <= 21) {
          return true;
        }
      });
    } else {
      this.winners = players.filter((player) => {
        if (player.score() >= dealer.score() && player.score() <= 21) {
          return true;
        }
      });
    }
    this.winners.forEach((player) => {
      player.won();
    });
  }

  isStanding(player) {
    return this.standing.includes(player);
  }

  allStanding() {
    return this.standing.length >= this.players.length;
  }

  hit(player) {
    if (!this.isStanding(player)) {
      player.deal(this.deck.draw());
    }
  }

  stand(player) {
    if (!this.isStanding(player)) {
      this.standing.push(player);
    }
    if (this.allStanding()) {
      this.startAi();
    }
  }

  bust(player) {
    this.stand(player);
    this.busted.push(player);
  }

  win(player) {
    this.stand(player);
    this.winners.push(player);
  }
}

let game = null;

const playerCount = 1; // More than 1 player is not working correctly
const deckCount = 0; // aka, magic deck

const main = () => {
  game = new Game(playerCount, deckCount);
  const newGameButton = document.querySelector('#newGame');
  newGameButton.addEventListener('click', (event) => {
    console.log(game.allStanding());
    if (game.allStanding()) {
      game.newGame();
    }
  });
  game.newGame();
};

document.addEventListener('DOMContentLoaded', main);
