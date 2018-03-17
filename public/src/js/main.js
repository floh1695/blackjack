/* eslint semi: ["error", "always", { "omitLastInOneLineBlock": true}] */
/* eslint space-before-function-paren: "off" */

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
    console.log('created:', this.longName());
  }

  longName() {
    return `${this.face} of ${this.suit}`;
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

  magicDeck() {
    return this.drawPile.concat(this.discardPile).length === 0;
  }
}

class Player {
  constructor() {
    this.id = Player.newId();
    this.hand = [];
  }
}
Player.id = 0;
Player.newId = () => {
  return Player.id++;
};

class Game {
  constructor(playerCount, deckCount = 0) {
    this.players = [];
    this.deck = new Deck(deckCount);
    this.deck.shuffle();
    for (let i = 0; i < playerCount; i++) {
      this.players.push(new Player());
    }
  }
}

let game = null;

const playerCount = 1;
const deckCount = 0; // aka, magic

const main = () => {
  game = new Game(playerCount, deckCount);
  console.log(game);
};

document.addEventListener('DOMContentLoaded', main);
