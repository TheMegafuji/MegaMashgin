import { ArrowUpRight, Gamepad2, ShoppingBag, Sparkles } from 'lucide-react';
import '../styles/game-invitation.css';

export function GameInvitation() {
  return (
    <section className="game-invitation" aria-labelledby="game-heading">
      <div className="game-miniature" aria-hidden="true">
        <span className="game-sun">
          <Sparkles size={28} />
        </span>
        <div className="mini-store">
          <span>MASHGIN MARKET</span>
          <div className="mini-awning" />
          <div className="mini-shelves">
            <i />
            <i />
            <i />
          </div>
          <div className="mini-door" />
        </div>
        <div className="mini-road">
          <span className="mini-shopper shopper-one">
            <ShoppingBag size={21} />
          </span>
          <span className="mini-shopper shopper-two">
            <ShoppingBag size={19} />
          </span>
          <span className="mini-shopper shopper-three">
            <ShoppingBag size={23} />
          </span>
        </div>
      </div>
      <div className="game-copy">
        <span className="eyebrow">
          <Gamepad2 size={16} /> A LITTLE PLAY BREAK
        </span>
        <h2 id="game-heading">Your market. Your little empire.</h2>
        <p>Stock the shelves, welcome your shoppers and grow a bustling neighborhood market.</p>
        <a
          className="game-link"
          href="https://game.megamashgin.top/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Play Mashgin Market <ArrowUpRight size={19} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <small>Free to explore | Opens in a new tab | Your bag stays here</small>
      </div>
    </section>
  );
}
