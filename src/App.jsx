import React, { useEffect, useMemo, useState } from 'react';

const SAVE_KEY = 'tiem-viet-su-thoi-gian-save-v2';

const actions = [
  { id: 'stock', label: 'Nhập hàng', icon: '▤' },
  { id: 'display', label: 'Bày kệ', icon: '▦' },
  { id: 'sell', label: 'Bán hàng', icon: '₫' },
  { id: 'upgrade', label: 'Nâng cấp', icon: '✦' },
  { id: 'history', label: 'Sổ sử', icon: '☰' },
];

const productCatalog = [
  {
    id: 'rice',
    name: 'Gạo nếp',
    basePrice: 80,
    stockGain: 3,
    color: '#f1bd55',
    lore: 'Lương thực cho dân làng và thuyền quân.',
  },
  {
    id: 'paper',
    name: 'Giấy dó',
    basePrice: 120,
    stockGain: 2,
    color: '#f7d989',
    lore: 'Ghi quân lệnh, thư tín và chuyện kể dân gian.',
  },
  {
    id: 'map',
    name: 'Bản đồ',
    basePrice: 220,
    stockGain: 1,
    color: '#5b9aa0',
    lore: 'Vẽ dòng Bạch Đằng, bãi cọc và con nước.',
  },
];

const customerQueue = [
  { name: 'Trần Hưng Đạo', wants: 'map', patience: 3, note: 'cần bản đồ sông Bạch Đằng trước giờ thủy triều đổi.' },
  { name: 'Người lái buôn Vân Đồn', wants: 'paper', patience: 2, note: 'muốn mua giấy dó để ghi sổ thuyền hàng.' },
  { name: 'Bà cụ làng bến', wants: 'rice', patience: 2, note: 'tìm gạo nếp nấu xôi đãi quân qua bến.' },
  { name: 'Học trò Quốc Tử Giám', wants: 'paper', patience: 3, note: 'xin giấy chép sử và lời dặn của thầy.' },
];

const upgradeCatalog = [
  {
    id: 'shelf',
    name: 'Kệ lim hai tầng',
    cost: 360,
    effect: 'Tăng sức chứa kệ và danh tiếng.',
  },
  {
    id: 'worker',
    name: 'Phụ việc bến sông',
    cost: 520,
    effect: 'Mỗi vài giây tự bán một món rẻ nếu có hàng trên kệ.',
  },
  {
    id: 'banner',
    name: 'Biển hiệu Đông Hồ',
    cost: 420,
    effect: 'Tăng lòng dân và phản ứng giá tốt hơn.',
  },
];

const roomObjects = [
  { id: 'shelf', name: 'Kệ hàng', layer: 3 },
  { id: 'map', name: 'Bản đồ Bạch Đằng', layer: 3 },
  { id: 'counter', name: 'Quầy bán', layer: 6 },
  { id: 'npc', name: 'Khách lịch sử', layer: 5 },
];

const initialGame = {
  money: 1280,
  people: 72,
  fame: 18,
  year: 1288,
  day: 1,
  level: 1,
  customerIndex: 0,
  products: {
    rice: { stock: 6, shelf: 3, price: 90 },
    paper: { stock: 3, shelf: 2, price: 130 },
    map: { stock: 2, shelf: 1, price: 250 },
  },
  upgrades: {
    shelf: 0,
    worker: 0,
    banner: 0,
  },
  achievements: [],
  log: ['Trần Hưng Đạo vừa ghé tiệm, hỏi mua bản đồ sông Bạch Đằng.'],
};

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return saved
      ? {
          ...initialGame,
          ...saved,
          products: { ...initialGame.products, ...saved.products },
          upgrades: { ...initialGame.upgrades, ...saved.upgrades },
          achievements: saved.achievements || initialGame.achievements,
          log: saved.log || initialGame.log,
        }
      : initialGame;
  } catch {
    return initialGame;
  }
}

function App() {
  const [game, setGame] = useState(loadGame);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('sell');
  const [pulse, setPulse] = useState('history');

  const customer = customerQueue[game.customerIndex % customerQueue.length];
  const totalStock = productCatalog.reduce((sum, item) => sum + game.products[item.id].stock, 0);
  const totalShelf = productCatalog.reduce((sum, item) => sum + game.products[item.id].shelf, 0);
  const shelfCapacity = 6 + game.upgrades.shelf * 2;
  const latestMessage = game.log[0] || '';

  const unlocks = useMemo(() => {
    const next = [];
    if (game.money >= 1600 && !game.achievements.includes('Bạc đầy tráp')) next.push('Bạc đầy tráp');
    if (game.fame >= 28 && !game.achievements.includes('Tiệm vang bến sông')) next.push('Tiệm vang bến sông');
    if (game.people >= 82 && !game.achievements.includes('Lòng dân quy tụ')) next.push('Lòng dân quy tụ');
    return next;
  }, [game.money, game.fame, game.people, game.achievements]);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    if (!unlocks.length) return;
    setGame((current) => ({
      ...current,
      achievements: [...current.achievements, ...unlocks],
      log: [`Mở thành tựu: ${unlocks.join(', ')}.`, ...current.log].slice(0, 6),
    }));
  }, [unlocks]);

  useEffect(() => {
    if (!game.upgrades.worker) return undefined;
    const timer = window.setInterval(() => {
      setGame((current) => {
        const item = productCatalog.find((product) => current.products[product.id].shelf > 0);
        if (!item) return current;
        return sellProduct(current, item.id, true);
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [game.upgrades.worker]);

  const handleAction = (actionId) => {
    setPulse(actionId);
    setActivePanel(actionId);

    if (actionId === 'history') {
      setLedgerOpen(true);
      setDialogOpen(false);
      return;
    }

    setLedgerOpen(false);
    setDialogOpen(true);

    if (actionId === 'stock') {
      setGame((current) => restock(current));
      return;
    }

    if (actionId === 'display') {
      setGame((current) => displayGoods(current));
      return;
    }

    if (actionId === 'sell') {
      setGame((current) => sellProduct(current, customer.wants, false));
    }
  };

  const buyUpgrade = (upgradeId) => {
    setPulse('upgrade');
    setActivePanel('upgrade');
    setLedgerOpen(false);
    setDialogOpen(true);
    setGame((current) => {
      const upgrade = upgradeCatalog.find((item) => item.id === upgradeId);
      const owned = current.upgrades[upgradeId];
      const cost = Math.round(upgrade.cost * (1 + owned * 0.65));
      if (current.money < cost) {
        return pushLog(current, `Chưa đủ tiền nâng cấp: ${upgrade.name}.`);
      }
      return pushLog(
        {
          ...current,
          money: current.money - cost,
          fame: current.fame + 2,
          people: Math.min(100, current.people + (upgradeId === 'banner' ? 3 : 1)),
          level: current.level + 1,
          upgrades: { ...current.upgrades, [upgradeId]: owned + 1 },
        },
        `Đã nâng cấp ${upgrade.name}. ${upgrade.effect}`,
      );
    });
  };

  const resetSave = () => {
    localStorage.removeItem(SAVE_KEY);
    setGame(initialGame);
    setActivePanel('sell');
    setDialogOpen(true);
    setLedgerOpen(false);
  };

  return (
    <main className="app-shell">
      <section className="phone-stage" aria-label="Tiệm Việt Sử Thời Gian">
        <header className="top-bar">
          <div className="brand">
            <span className="seal">史</span>
            <div>
              <p>Tiệm Việt Sử</p>
              <h1>Thời Gian</h1>
            </div>
          </div>
          <div className="resource-grid" aria-label="Tài nguyên">
            <Stat label="Tiền" value={`${game.money.toLocaleString('vi-VN')}đ`} />
            <Stat label="Lòng dân" value={`${game.people}%`} />
            <Stat label="Danh tiếng" value={game.fame} />
            <Stat label="Ngày" value={`${game.day}/${game.year}`} />
          </div>
        </header>

        <section className={`scene-wrap scene-${pulse}`}>
          <SceneLayers />

          <div className="layer shop-layer">
            <div className="shop-sign">Tiệm Việt Sử Thời Gian</div>
            <div className="shop-roof">
              <span />
              <span />
              <span />
            </div>

            <div className="shop-room">
              <div className="wall-pattern" />
              <div className="back-beam" aria-hidden="true">
                <span />
                <span />
              </div>
              <div className="lanterns" aria-hidden="true">
                <span />
                <span />
              </div>

              <div className="left-shelf" aria-label="Kệ hàng">
                {productCatalog.map((item) => (
                  <div className="shelf-row" key={item.id}>
                    <span>{item.name}</span>
                    <div className="goods">
                      {Array.from({ length: Math.max(1, Math.min(5, game.products[item.id].shelf)) }).map(
                        (_, index) => (
                          <i key={index} style={{ '--good-color': item.color }} />
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="map-panel" aria-label="Bản đồ sông Bạch Đằng">
                <div className="map-title">Bạch Đằng</div>
                <div className="river" />
                <div className="stakes">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="npc-area">
                <div className="general">
                  <div className="hat" />
                  <div className="face" />
                  <div className="robe" />
                </div>
                <div className="npc-name">{customer.name}</div>
              </div>

              <div className="counter">
                <div className="counter-top">
                  <span className="jar" />
                  <span className="scroll" />
                  <span className="coins" />
                </div>
                <div className="counter-front">
                  <strong>Kho {totalStock}</strong>
                  <strong>
                    Kệ {totalShelf}/{shelfCapacity}
                  </strong>
                  <strong>Cấp {game.level}</strong>
                </div>
              </div>

              <div className="foreground-props" aria-hidden="true">
                <span className="rice-basket" />
                <span className="floor-mat" />
                <span className="coin-stack" />
              </div>
            </div>
          </div>

          <div className="layer effect-layer" aria-hidden="true">
            <span className="time-ring" />
            <span className="spark spark-one" />
            <span className="spark spark-two" />
            <span className="spark spark-three" />
          </div>

          <StatusPanel
            activePanel={activePanel}
            customer={customer}
            game={game}
            shelfCapacity={shelfCapacity}
            buyUpgrade={buyUpgrade}
          />

          {dialogOpen && (
            <aside className="dialog-card" role="dialog" aria-label="Nhân vật lịch sử ghé tiệm">
              <div className="dialog-head">
                <span>{customer.name}</span>
                <button type="button" onClick={() => setDialogOpen(false)} aria-label="Đóng hội thoại">
                  ×
                </button>
              </div>
              <p>{latestMessage}</p>
            </aside>
          )}

          {ledgerOpen && (
            <aside className="ledger-card" role="dialog" aria-label="Sổ sử">
              <div className="dialog-head">
                <span>Sổ sử</span>
                <button type="button" onClick={() => setLedgerOpen(false)} aria-label="Đóng sổ sử">
                  ×
                </button>
              </div>
              <div className="ledger-actions">
                <button type="button" onClick={resetSave}>
                  Chơi lại
                </button>
              </div>
              <h2>Ghi chép tiệm</h2>
              {game.log.map((entry, index) => (
                <p key={`${entry}-${index}`}>{entry}</p>
              ))}
              <h2>Thành tựu</h2>
              <p>{game.achievements.length ? game.achievements.join(' · ') : 'Chưa mở thành tựu.'}</p>
              <h2>Vật trong phòng</h2>
              <p>{roomObjects.map((item) => `${item.name} L${item.layer}`).join(' · ')}</p>
            </aside>
          )}
        </section>

        <nav className="bottom-nav" aria-label="Thao tác tiệm">
          {actions.map((action) => (
            <button
              className={pulse === action.id ? 'active' : ''}
              type="button"
              key={action.id}
              onClick={() => handleAction(action.id)}
            >
              <span className="button-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span>{action.label}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

function SceneLayers() {
  return (
    <>
      <div className="layer sky-layer" aria-hidden="true">
        <div className="sun-disc" />
        <span className="cloud cloud-one" />
        <span className="cloud cloud-two" />
        <span className="bird bird-one" />
        <span className="bird bird-two" />
      </div>

      <div className="layer village-layer" aria-hidden="true">
        <span className="bamboo bamboo-left" />
        <span className="bamboo bamboo-right" />
        <div className="village-houses">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="layer river-layer" aria-hidden="true">
        <div className="bach-dang-river" />
        <span className="boat boat-left" />
        <span className="boat boat-right" />
        <div className="river-stakes">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </>
  );
}

function StatusPanel({ activePanel, customer, game, shelfCapacity, buyUpgrade }) {
  if (activePanel === 'upgrade') {
    return (
      <aside className="management-panel">
        <h2>Nâng cấp tiệm</h2>
        <div className="upgrade-list">
          {upgradeCatalog.map((upgrade) => {
            const owned = game.upgrades[upgrade.id];
            const cost = Math.round(upgrade.cost * (1 + owned * 0.65));
            return (
              <button type="button" key={upgrade.id} onClick={() => buyUpgrade(upgrade.id)}>
                <strong>{upgrade.name}</strong>
                <span>{cost.toLocaleString('vi-VN')}đ · cấp {owned}</span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  if (activePanel === 'stock' || activePanel === 'display') {
    return (
      <aside className="management-panel">
        <h2>{activePanel === 'stock' ? 'Kho hàng' : `Kệ bày ${totalShelfOf(game)}/${shelfCapacity}`}</h2>
        <div className="product-grid">
          {productCatalog.map((item) => (
            <article key={item.id}>
              <span className="product-dot" style={{ '--good-color': item.color }} />
              <strong>{item.name}</strong>
              <small>
                Kho {game.products[item.id].stock} · Kệ {game.products[item.id].shelf}
              </small>
            </article>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="management-panel customer-card">
      <h2>{customer.name}</h2>
      <p>{customer.note}</p>
      <div className="price-strip">
        {productCatalog.map((item) => (
          <span key={item.id}>
            {item.name}: {game.products[item.id].price.toLocaleString('vi-VN')}đ
          </span>
        ))}
      </div>
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function restock(current) {
  const cost = 150 + current.level * 35;
  if (current.money < cost) return pushLog(current, 'Không đủ tiền nhập chuyến hàng mới.');
  const products = { ...current.products };
  productCatalog.forEach((item) => {
    products[item.id] = {
      ...products[item.id],
      stock: products[item.id].stock + item.stockGain,
    };
  });
  return pushLog(
    {
      ...current,
      money: current.money - cost,
      people: Math.min(100, current.people + 1),
      products,
    },
    `Đã nhập chuyến hàng mới với giá ${cost.toLocaleString('vi-VN')}đ.`,
  );
}

function displayGoods(current) {
  const capacity = 6 + current.upgrades.shelf * 2;
  let shelfTotal = totalShelfOf(current);
  const products = { ...current.products };
  let moved = 0;
  for (const item of productCatalog) {
    if (shelfTotal >= capacity) break;
    if (products[item.id].stock <= 0) continue;
    products[item.id] = {
      ...products[item.id],
      stock: products[item.id].stock - 1,
      shelf: products[item.id].shelf + 1,
    };
    shelfTotal += 1;
    moved += 1;
  }
  if (!moved) return pushLog(current, 'Kệ đã đầy hoặc kho chưa có hàng để bày.');
  return pushLog({ ...current, products, fame: current.fame + 1 }, `Đã bày thêm ${moved} món lên kệ.`);
}

function sellProduct(current, productId, automatic) {
  const item = productCatalog.find((product) => product.id === productId) || productCatalog[0];
  const currentProduct = current.products[item.id];
  if (currentProduct.shelf <= 0) return pushLog(current, `${item.name} chưa có trên kệ để bán.`);

  const products = {
    ...current.products,
    [item.id]: { ...currentProduct, shelf: currentProduct.shelf - 1 },
  };
  const ratio = currentProduct.price / item.basePrice;
  const bannerBonus = current.upgrades.banner * 0.08;
  const reaction =
    ratio <= 0.85
      ? { text: 'khách vui vì giá mềm', fame: 1, people: 2 }
      : ratio <= 1.25 + bannerBonus
        ? { text: 'khách hài lòng', fame: 2, people: 1 }
        : ratio <= 1.55 + bannerBonus
          ? { text: 'khách hơi đắn đo', fame: 0, people: -1 }
          : { text: 'khách cau mày vì giá cao', fame: -2, people: -2 };

  return pushLog(
    {
      ...current,
      money: current.money + currentProduct.price,
      people: Math.max(0, Math.min(100, current.people + reaction.people)),
      fame: Math.max(0, current.fame + reaction.fame),
      day: automatic ? current.day : current.day + 1,
      customerIndex: automatic ? current.customerIndex : current.customerIndex + 1,
      products,
    },
    `${automatic ? 'Phụ việc' : 'Bạn'} bán ${item.name}: ${reaction.text}.`,
  );
}

function totalShelfOf(game) {
  return productCatalog.reduce((sum, item) => sum + game.products[item.id].shelf, 0);
}

function pushLog(game, message) {
  return {
    ...game,
    log: [message, ...game.log].slice(0, 6),
  };
}

export default App;
