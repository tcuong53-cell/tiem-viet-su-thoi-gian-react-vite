import React, { useEffect, useMemo, useState } from 'react';

const SAVE_KEY = 'tiem-viet-su-thoi-gian-save-v2';
const CHECKPOINT_KEY = 'tiem-viet-su-thoi-gian-checkpoints';

/* === Sự kiện lịch sử ngẫu nhiên === */
const historicalEvents = [
  { id: 'rain', name: 'Mùa mưa kéo dài', effect: 'Giá gạo giảm 20%.', apply: (g) => ({...g, products: {...g.products, rice: {...g.products.rice, price: Math.round(g.products.rice.price * 0.8)}}}) },
  { id: 'war', name: 'Chiến sự phương Bắc', effect: 'Nhu cầu bản đồ tăng, giá bản đồ tăng 30%.', apply: (g) => ({...g, products: {...g.products, map: {...g.products.map, price: Math.round(g.products.map.price * 1.3)}}}) },
  { id: 'festival', name: 'Lễ hội làng bến sông', effect: 'Lòng dân tăng 5, danh tiếng tăng 3.', apply: (g) => ({...g, people: Math.min(100, g.people + 5), fame: g.fame + 3}) },
  { id: 'flood', name: 'Lũ sông Bạch Đằng', effect: 'Mất 2 hàng trong kho.', apply: (g) => { const p = {...g.products}; for (const k of Object.keys(p)) { p[k] = {...p[k], stock: Math.max(0, p[k].stock - 1)}; } return {...g, products: p}; } },
  { id: 'scholar', name: 'Học giả ghé thăm', effect: 'Giá giấy dó tăng 25%.', apply: (g) => ({...g, products: {...g.products, paper: {...g.products.paper, price: Math.round(g.products.paper.price * 1.25)}}}) },
];

/* === Checkpoint Replay === */
function saveCheckpoint(game) {
  const checkpoint = {
    id: Date.now(),
    day: game.day,
    year: game.year,
    money: game.money,
    fame: game.fame,
    people: game.people,
    snapshot: JSON.parse(JSON.stringify(game)),
  };
  try {
    const existing = loadCheckpoints();
    const updated = [checkpoint, ...existing].slice(0, 5);
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(updated));
  } catch { /* bỏ qua lỗi localStorage */ }
}

function loadCheckpoints() {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadCheckpoint(checkpointId, setGame) {
  const checkpoints = loadCheckpoints();
  const cp = checkpoints.find((c) => c.id === checkpointId);
  if (cp && cp.snapshot) {
    setGame(cp.snapshot);
  }
}

const actions = [
  { id: 'manage', label: 'Quản lý', icon: '▦' },
  { id: 'sell', label: 'Bán hàng', icon: '₫' },
  { id: 'quest', label: 'Ải sử', icon: '⌁' },
  { id: 'talent', label: 'Quan Võ', icon: '✦' },
  { id: 'history', label: 'Sổ sử', icon: '☰' },
];

const navigationActions = [
  { id: 'manage', label: 'Cửa tiệm', icon: '⌂' },
  { id: 'sell', label: 'Khu phố', icon: '▧' },
  { id: 'talent', label: 'Quan Võ', icon: '✦' },
  { id: 'history', label: 'Quan Văn', icon: '書' },
  { id: 'quest', label: 'Thương lộ', icon: '⌁' },
];

const gameNameIdeas = ['Tiệm Quán Sử Việt', 'Hành Trình Sử Việt', 'Đại Việt Tạp Hóa', 'Thời Gian Đại Việt', 'Ký Ức Ngàn Năm'];

const relicCatalog = [
  {
    id: 'thuanThien',
    name: 'Kiếm Thuận Thiên',
    era: 'hauLe',
    effect: 'Tăng Võ uy khi hỗ trợ các biến cố Lam Sơn.',
    story: 'Cổ vật cộng hưởng với lời thề dựng nước, chỉ cho phép thay đổi những chi tiết nhỏ để giữ đúng mạch sử.',
  },
  {
    id: 'lyStele',
    name: 'Tấm bia đá thời Lý',
    era: 'lyTran',
    effect: 'Tăng Dân Trí và giảm chi phí mở trường.',
    story: 'Dòng chữ mờ trên bia mở lối về các khoa thi, chùa tháp và làng nghề Đại Việt.',
  },
  {
    id: 'templeBell',
    name: 'Chuông chùa cổ',
    era: 'hungAuLac',
    effect: 'Tăng lòng dân, lương thảo và ký ức làng xã.',
    story: 'Tiếng chuông nối hiện tại với làng quê, nhắc người chơi gìn giữ ký ức dân tộc thay vì bẻ cong lịch sử.',
  },
];

const eraCatalog = [
  {
    id: 'hungAuLac',
    name: 'Hùng Vương - Âu Lạc',
    year: 258,
    unlockStage: 1,
    mapName: 'Làng lúa nước Cổ Loa',
    architecture: 'nhà sàn, ruộng lúa, lò đồng và thành đất xoắn ốc',
    focus: 'Nông vụ',
    bonus: 'Quan Võ đúng thời tăng sản lượng lương thảo.',
  },
  {
    id: 'bacThuoc',
    name: 'Bắc thuộc',
    year: 43,
    unlockStage: 2,
    mapName: 'Làng nổi dậy Mê Linh',
    architecture: 'đình làng, bãi luyện quân, ruộng nước và đường sứ bộ phương Bắc',
    focus: 'Kháng cự',
    bonus: 'Nữ anh hùng và dân binh tăng Bộ chiến khi bảo vệ làng xã.',
  },
  {
    id: 'ngoDinhTienLe',
    name: 'Ngô - Đinh - Tiền Lê',
    year: 968,
    unlockStage: 2,
    mapName: 'Hoa Lư và cờ lau tập trận',
    architecture: 'núi đá, thành đất, trại quân và bến sông chiến lược',
    focus: 'Dựng nền tự chủ',
    bonus: 'Quan Võ đúng thời tăng Võ uy khi mở tuyến thương lộ mới.',
  },
  {
    id: 'lyTran',
    name: 'Lý - Trần',
    year: 1288,
    unlockStage: 3,
    mapName: 'Bến sông thời Lý - Trần',
    architecture: 'chùa tháp, nhà tranh, xưởng rèn và bãi cọc thủy chiến',
    focus: 'Thủy chiến',
    bonus: 'Quan Võ đời Trần nhận x2 hiệu suất khi trấn cơ sở đúng thời.',
  },
  {
    id: 'hauLe',
    name: 'Hậu Lê',
    year: 1484,
    unlockStage: 4,
    mapName: 'Kẻ Chợ - Phố Hiến',
    architecture: 'phường gốm, trường thi, chợ búa và bến thuyền sầm uất',
    focus: 'Thi cử',
    bonus: 'Quan Văn mưu lược tăng Dân Trí và giảm hao Lương Thảo.',
  },
  {
    id: 'nguyen',
    name: 'Thời Nguyễn',
    year: 1819,
    unlockStage: 5,
    mapName: 'Hội An - Bao Vinh',
    architecture: 'ngói âm dương, tiệm lụa, thương điếm và tàu ngoại quốc',
    focus: 'Giao thương',
    bonus: 'Đặc quyền Quan Văn tăng giá trị hàng cao cấp và thương cảng.',
  },
];

const historicalCrises = [
  {
    id: 'mongol',
    era: 'lyTran',
    name: 'Chống quân Mông Nguyên',
    threat: 'Kỵ binh và thuyền chiến áp sát bến sông',
    reward: 'Cổ vật bãi cọc và đất cảng',
  },
  {
    id: 'lamSon',
    era: 'hauLe',
    name: 'Khởi nghĩa Lam Sơn',
    threat: 'Sơn tặc và quân truy kích chặn tuyến hàng',
    reward: 'Điểm Uy Vọng và đất đai khai khẩn',
  },
  {
    id: 'pirates',
    era: 'nguyen',
    name: 'Hải tặc Tàu Ô ở Vịnh Bắc Bộ',
    threat: 'Tàu cướp biển đòi phí bảo kê thương cảng',
    reward: 'Giấy phép hải thương và cổ vật ngoại thương',
  },
  {
    id: 'auLac',
    era: 'hungAuLac',
    name: 'Giữ thành Cổ Loa',
    threat: 'Biến loạn vùng biên làm gián đoạn lúa và đồng',
    reward: 'Đất ruộng và uy danh làng xã',
  },
  {
    id: 'trungSisters',
    era: 'bacThuoc',
    name: 'Hai Bà Trưng phất cờ',
    threat: 'Quan quân đô hộ siết thuế, làm đứt nguồn lương thảo làng xã',
    reward: 'Cổ vật Mê Linh và điểm lòng dân',
  },
  {
    id: 'bachDangNgo',
    era: 'ngoDinhTienLe',
    name: 'Bạch Đằng mở nền tự chủ',
    threat: 'Thuyền giặc tràn vào cửa sông, đe dọa tuyến buôn Vân Đồn',
    reward: 'Bản đồ bãi cọc và quyền mở bến cảng',
  },
];

const greatWorkCatalog = [
  {
    id: 'royalCitadel',
    name: 'Xây Hoàng Thành',
    cost: { money: 2200, food: 260, weapons: 90, prestige: 6 },
    effect: 'Đốt tài nguyên lớn để tăng giới hạn thị phần và uy danh lâu dài.',
  },
  {
    id: 'nationalAcademy',
    name: 'Quốc Tử Giám',
    cost: { money: 1800, food: 180, weapons: 40, literacy: 18 },
    effect: 'Tăng Dân Trí, giảm chi phí nâng cấp và mở thêm Quan Văn.',
  },
  {
    id: 'grandHarbor',
    name: 'Đại Thương Cảng Hội An',
    cost: { money: 2600, food: 220, weapons: 120, prestige: 8 },
    effect: 'Tăng thu nhập thương cảng, giá lụa và lợi nhuận giao thương ngoại quốc.',
  },
];

const productCatalog = [
  {
    id: 'rice',
    name: 'Gạo nếp',
    category: 'Thiết yếu',
    basePrice: 80,
    stockGain: 3,
    color: '#f1bd55',
    lore: 'Lương thực cho dân làng và thuyền quân.',
  },
  {
    id: 'paper',
    name: 'Giấy dó',
    category: 'Ký ức',
    basePrice: 120,
    stockGain: 2,
    color: '#f7d989',
    lore: 'Ghi quân lệnh, thư tín và chuyện kể dân gian.',
  },
  {
    id: 'map',
    name: 'Bản đồ',
    category: 'Chiến lược',
    basePrice: 220,
    stockGain: 1,
    color: '#5b9aa0',
    lore: 'Vẽ dòng Bạch Đằng, bãi cọc và con nước.',
  },
  {
    id: 'silk',
    name: 'Lụa tơ tằm',
    category: 'Quà tặng',
    basePrice: 320,
    stockGain: 1,
    color: '#e8a0c8',
    lore: 'Lụa quý dùng may áo cho quan lại và triều đình.',
  },
  {
    id: 'ink',
    name: 'Mực tàu',
    category: 'Ký ức',
    basePrice: 160,
    stockGain: 2,
    color: '#2d2d2d',
    lore: 'Mực đen tuyền để viết thư pháp và vẽ tranh.',
  },
  {
    id: 'pepper',
    name: 'Hồ tiêu',
    category: 'Ngoại thương',
    basePrice: 280,
    stockGain: 1,
    color: '#5f3b1f',
    lore: 'Gia vị quý trong thương điếm Hội An, hút thuyền buôn Nhật và Bồ Đào Nha.',
  },
  {
    id: 'ceramic',
    name: 'Gốm Chu Đậu',
    category: 'Thủ công',
    basePrice: 240,
    stockGain: 1,
    color: '#8fb7b1',
    lore: 'Gốm men trắng lam dùng trao đổi trong Phố Hiến và thương cảng.',
  },
  {
    id: 'weapon',
    name: 'Vũ khí rèn',
    category: 'Quân nhu',
    basePrice: 300,
    stockGain: 1,
    color: '#8b8f94',
    lore: 'Kiếm, giáo và nỏ dùng bảo vệ đoàn thương buôn khi biến cố nổi lên.',
  },
];

const customerQueue = [
  { name: 'Trần Hưng Đạo', wants: 'map', patience: 3, note: 'cần bản đồ sông Bạch Đằng trước giờ thủy triều đổi.' },
  { name: 'Người lái buôn Vân Đồn', wants: 'paper', patience: 2, note: 'muốn mua giấy dó để ghi sổ thuyền hàng.' },
  { name: 'Bà cụ làng bến', wants: 'rice', patience: 2, note: 'tìm gạo nếp nấu xôi đãi quân qua bến.' },
  { name: 'Học trò Quốc Tử Giám', wants: 'paper', patience: 3, note: 'xin giấy chép sử và lời dặn của thầy.' },
  { name: 'Thuyền buôn Hội An', wants: 'pepper', patience: 3, note: 'tìm hồ tiêu, lụa và gốm để đổi hàng ngoại quốc.' },
  { name: 'Thợ gốm Phố Hiến', wants: 'ceramic', patience: 2, note: 'cần mẫu gốm đẹp để mở đơn hàng mới.' },
  { name: 'Dân binh trấn lộ', wants: 'weapon', patience: 2, note: 'xin thêm vũ khí rèn trước khi hộ tống thương đoàn.' },
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

const ventureCatalog = [
  {
    id: 'breakfast',
    name: 'Tửu lâu bến sông',
    cost: 460,
    income: 58,
    unlockStage: 1,
    specialty: 'agriculture',
    detail: 'Nơi tiếp quan khách, đàm đạo việc nước và gom tin tức thương lộ.',
  },
  {
    id: 'scriptorium',
    name: 'Phủ đệ thương nghị',
    cost: 760,
    income: 92,
    unlockStage: 2,
    specialty: 'craft',
    detail: 'Soạn công văn, giấy phép và khế ước để giảm rào cản giao thương.',
  },
  {
    id: 'gameRoom',
    name: 'Trại ngựa chuyển vận',
    cost: 980,
    income: 126,
    unlockStage: 3,
    specialty: 'infantry',
    detail: 'Nuôi ngựa trạm dịch, tăng tốc sản xuất và giao hàng đường bộ.',
  },
  {
    id: 'nightMarket',
    name: 'Thương cảng Hội An',
    cost: 1420,
    income: 170,
    unlockStage: 4,
    specialty: 'naval',
    detail: 'Cảng lớn cần hộ vệ thủy chiến, mở tuyến buôn xa và thu nhập offline mạnh.',
  },
  {
    id: 'netCafe',
    name: 'Lò rèn binh khí',
    cost: 1680,
    income: 210,
    unlockStage: 3,
    specialty: 'craft',
    detail: 'Sản xuất khí giới, xe kéo và dụng cụ bảo vệ đoàn thương buôn.',
  },
  {
    id: 'barber',
    name: 'Trạm phu trạm',
    cost: 1320,
    income: 148,
    unlockStage: 2,
    specialty: 'infantry',
    detail: 'Điều phối phu trạm, kho nghỉ và tuyến giao vận giữa các phủ lộ.',
  },
  {
    id: 'cassetteShop',
    name: 'Xưởng đóng thuyền',
    cost: 1860,
    income: 236,
    unlockStage: 4,
    specialty: 'naval',
    detail: 'Đóng thuyền buôn và thuyền hộ tống để vượt sông biển, chống hải tặc.',
  },
  {
    id: 'wetRiceFarm',
    name: 'Nông trang tịch điền',
    cost: 520,
    income: 64,
    unlockStage: 1,
    specialty: 'agriculture',
    detail: 'Sản xuất lúa nước, lương thảo và giữ nền kinh tế thời bình.',
  },
  {
    id: 'academy',
    name: 'Học viện thầy đồ',
    cost: 1180,
    income: 112,
    unlockStage: 3,
    specialty: 'craft',
    detail: 'Tăng EXP nhân tài, mở khoa thi và giúp cắt chi phí nâng cấp.',
  },
  {
    id: 'fortress',
    name: 'Pháo đài / Doanh trại',
    cost: 1540,
    income: 132,
    unlockStage: 3,
    specialty: 'infantry',
    detail: 'Hỗ trợ thủ thành, tower defense và tích điểm Võ uy khi biến cố đến.',
  },
];

const personnelCatalog = [
  {
    id: 'tranHungDao',
    kind: 'Quan Võ',
    name: 'Yết Kiêu',
    rarity: 'Quý hiếm',
    cost: 780,
    inviteCost: 2,
    maxLevel: 5,
    target: 'Thủy chiến, thương cảng và xưởng thuyền',
    effect: 'Dẹp hải tặc, hộ tống thuyền hàng và tăng lực thương lộ đường thủy.',
    era: 'lyTran',
    stats: { agriculture: 8, craft: 16, naval: 40, infantry: 22 },
    specialty: 'cassetteShop',
    domain: 'naval',
  },
  {
    id: 'nguyenTrai',
    kind: 'Quan Võ',
    name: 'Phạm Ngũ Lão',
    rarity: 'Trác việt',
    cost: 620,
    inviteCost: 1,
    maxLevel: 5,
    target: 'Bộ binh, trạm dịch và đoàn hộ vệ',
    effect: 'Tăng Võ Lực khi đánh ải và giữ kỷ luật phu trạm.',
    era: 'lyTran',
    stats: { agriculture: 14, craft: 12, naval: 12, infantry: 38 },
    specialty: 'barber',
    domain: 'infantry',
  },
  {
    id: 'dongHoArtist',
    kind: 'Quan Võ',
    name: 'Dã Tượng',
    rarity: 'Hiếm',
    cost: 520,
    inviteCost: 1,
    maxLevel: 4,
    target: 'Hộ vệ thủy bộ, phối hợp cùng Yết Kiêu',
    effect: 'Tăng Thể Lực đoàn hàng và giảm tổn thất khi gặp biến cố.',
    era: 'lyTran',
    stats: { agriculture: 12, craft: 18, naval: 34, infantry: 26 },
    specialty: 'nightMarket',
    domain: 'naval',
  },
  {
    id: 'caTruSinger',
    kind: 'Quan Võ',
    name: 'Đô Úy Cấm Quân',
    rarity: 'Tốt',
    cost: 560,
    inviteCost: 1,
    maxLevel: 4,
    target: 'Giữ kho, lò rèn và kỷ luật nhân công',
    effect: 'Tăng Thống Soái khi quản lý cơ sở nặng.',
    era: 'lyTran',
    stats: { agriculture: 12, craft: 30, naval: 10, infantry: 30 },
    specialty: 'netCafe',
    domain: 'craft',
  },
];

const extraTalentCatalog = [
  {
    id: 'haiBaTrung',
    kind: 'Quan Võ',
    name: 'Hai Bà Trưng',
    rarity: 'Cực hiếm',
    cost: 900,
    inviteCost: 2,
    maxLevel: 6,
    target: 'Nữ anh hùng Mê Linh, mạnh ở thời Bắc thuộc',
    effect: 'Kỹ năng Khởi nghĩa Mê Linh tăng morale và Bộ chiến toàn đội.',
    era: 'bacThuoc',
    stats: { agriculture: 22, craft: 14, naval: 12, infantry: 42 },
    specialty: 'fortress',
    domain: 'infantry',
  },
  {
    id: 'ngoQuyen',
    kind: 'Quan Võ',
    name: 'Ngô Quyền',
    rarity: 'Cực hiếm',
    cost: 880,
    inviteCost: 2,
    maxLevel: 6,
    target: 'Bạch Đằng, thủy chiến và mở nền tự chủ',
    effect: 'Kỹ năng Bãi cọc Bạch Đằng tăng mạnh Thủy chiến khi xuất chinh.',
    era: 'ngoDinhTienLe',
    stats: { agriculture: 18, craft: 18, naval: 44, infantry: 30 },
    specialty: 'nightMarket',
    domain: 'naval',
  },
  {
    id: 'voNguyenGiap',
    kind: 'Quan Võ',
    name: 'Võ Nguyên Giáp',
    rarity: 'Cực hiếm',
    cost: 960,
    inviteCost: 3,
    maxLevel: 6,
    target: 'Danh tướng hiện đại, mở nhánh ký ức cuối game',
    effect: 'Kỹ năng Chiến dịch dài ngày giảm hao quân nhu và tăng Võ uy tổng.',
    era: 'nguyen',
    stats: { agriculture: 18, craft: 24, naval: 18, infantry: 48 },
    specialty: 'fortress',
    domain: 'infantry',
  },
  {
    id: 'buiThiXuan',
    kind: 'Quan Võ',
    name: 'Bùi Thị Xuân',
    rarity: 'Hiếm',
    cost: 620,
    inviteCost: 1,
    maxLevel: 5,
    target: 'Nữ tướng luyện tượng binh và bộ chiến',
    effect: 'Tăng Bộ chiến và tốc độ huấn luyện trong doanh trại.',
    era: 'nguyen',
    stats: { agriculture: 16, craft: 18, naval: 12, infantry: 36 },
    specialty: 'fortress',
    domain: 'infantry',
  },
  {
    id: 'hoiAnCaptain',
    kind: 'Quan Võ',
    name: 'Thuyền trưởng Hội An',
    rarity: 'Tốt',
    cost: 480,
    inviteCost: 1,
    maxLevel: 5,
    target: 'Thương nhân / kỹ thuật, mạnh ở thương cảng',
    effect: 'Tăng Thủy chiến, ngoại thương và lợi nhuận hồ tiêu.',
    era: 'nguyen',
    stats: { agriculture: 14, craft: 22, naval: 34, infantry: 16 },
    specialty: 'cassetteShop',
    domain: 'naval',
  },
  {
    id: 'marketMatriarch',
    kind: 'Quan Võ',
    name: 'Lê Lai',
    rarity: 'Hiếm',
    cost: 260,
    inviteCost: 1,
    maxLevel: 4,
    target: 'Đánh chặn sơn tặc, giữ tuyến Lam Sơn',
    effect: 'Tăng mạnh Võ Lực khi vượt ải thương lộ có rủi ro phục kích.',
    era: 'hauLe',
    stats: { agriculture: 18, craft: 12, naval: 10, infantry: 36 },
    specialty: 'gameRoom',
    domain: 'infantry',
  },
  {
    id: 'netKeeper',
    kind: 'Quan Võ',
    name: 'Nguyễn Xí',
    rarity: 'Tốt',
    cost: 420,
    inviteCost: 1,
    maxLevel: 5,
    target: 'Thống lĩnh trại ngựa và quân hộ vệ',
    effect: 'Tăng Thống Soái, giúp cơ sở sản xuất nặng chạy ổn định.',
    era: 'hauLe',
    stats: { agriculture: 18, craft: 16, naval: 12, infantry: 34 },
    specialty: 'gameRoom',
    domain: 'infantry',
  },
  {
    id: 'barberUncle',
    kind: 'Quan Võ',
    name: 'Tổng Tiêu Đầu',
    rarity: 'Thường',
    cost: 560,
    inviteCost: 1,
    maxLevel: 5,
    target: 'Bảo vệ chuyến hàng và trạm phu trạm',
    effect: 'Tăng Thể Lực, giảm thời gian vận chuyển và hao hụt hàng.',
    era: 'nguyen',
    stats: { agriculture: 20, craft: 16, naval: 12, infantry: 30 },
    specialty: 'barber',
    domain: 'infantry',
  },
  {
    id: 'cassetteCollector',
    kind: 'Quan Võ',
    name: 'Cấm Quân Vệ',
    rarity: 'Cực hiếm',
    cost: 840,
    inviteCost: 2,
    maxLevel: 6,
    target: 'Lò rèn, phủ đệ và thương lộ cấp cao',
    effect: 'Tăng cả Võ Lực lẫn Thống Soái, mở lợi thế khi tranh thị phần.',
    era: 'nguyen',
    stats: { agriculture: 12, craft: 34, naval: 20, infantry: 34 },
    specialty: 'netCafe',
    domain: 'craft',
  },
];

const artistCatalog = [
  {
    id: 'chuVanAn',
    name: 'Chu Văn An - Vạn thế sư biểu',
    rarity: 'Hiếm',
    era: 'lyTran',
    source: 'Kết giao qua Quốc Tử Giám, văn phòng tứ bảo và khoa thi.',
    linkedTalents: ['nguyenTrai', 'caTruSinger'],
    role: 'Tăng Dân Trí, giảm chi phí học viện và tăng EXP bồi dưỡng Quan Võ.',
  },
  {
    id: 'nguyenDu',
    name: 'Nguyễn Du - Ký Ức Truyện Kiều',
    rarity: 'Hiếm',
    era: 'nguyen',
    source: 'Kết giao qua sách quý, thơ ca và thương điếm văn hóa.',
    linkedTalents: ['buiThiXuan', 'hoiAnCaptain'],
    role: 'Tăng điểm ký ức dân tộc, lòng dân và phần thưởng mini-game văn hóa.',
  },
  {
    id: 'leQuyDon',
    name: 'Lê Quý Đôn - Bách khoa thư Đại Việt',
    rarity: 'Cực hiếm',
    era: 'hauLe',
    source: 'Kết giao qua Bảng Vàng, thư tịch và học viện.',
    linkedTalents: ['marketMatriarch', 'netKeeper'],
    role: 'Tăng Công khí, Dân Trí và hiệu quả biên soạn sách sử.',
  },
  {
    id: 'doanThiDiem',
    name: 'Đoàn Thị Điểm - Hồng Hà nữ sĩ',
    rarity: 'Tốt',
    era: 'hauLe',
    source: 'Kết giao qua thơ ca, giấy dó và sự kiện trường thi.',
    linkedTalents: ['haiBaTrung', 'barberUncle'],
    role: 'Tăng lòng dân, Bảng Vàng và giảm rủi ro khi du hành thời gian.',
  },
  {
    id: 'dongHoMuse',
    name: 'Trần Hưng Đạo - Quốc Công Tiết Chế',
    rarity: 'Cực hiếm',
    era: 'lyTran',
    source: 'Kết giao qua Binh Thư Yếu Lược và các ải thủy chiến.',
    linkedTalents: ['tranHungDao', 'dongHoArtist'],
    role: 'Bảo trợ Yết Kiêu và Dã Tượng, tăng mạnh Võ Lực thương lộ đường thủy.',
  },
  {
    id: 'caiLuongIcon',
    name: 'Nguyễn Trãi - Mưu lược Lam Sơn',
    rarity: 'Cực hiếm',
    era: 'hauLe',
    source: 'Kết giao qua sách quý, thơ văn và tuyến nhiệm vụ Lam Sơn.',
    linkedTalents: ['marketMatriarch', 'netKeeper'],
    role: 'Bảo trợ Lê Lai và Nguyễn Xí, tăng Thống Soái và thưởng thương lượng.',
  },
  {
    id: 'arcadeIdol',
    name: 'Quan Hải Quan Hội An',
    rarity: 'Tốt',
    era: 'nguyen',
    source: 'Kết giao bằng kỳ trân dị bảo, công văn và uy vọng thương bang.',
    linkedTalents: ['cassetteCollector', 'barberUncle'],
    role: 'Giảm thuế giao thương, tăng giá trị bán lụa và rút ngắn xây dựng cơ sở.',
  },
];

const customerIncidents = [
  {
    id: 'thief',
    name: 'Kẻ trộm lẫn trong dòng khách',
    prompt: 'Khóa lối ra, nhờ khách quen nhận diện và báo tuần phiên.',
    rewardDiamonds: 2,
    rewardMoney: 120,
  },
  {
    id: 'lostChild',
    name: 'Đứa trẻ đi lạc trước cửa tiệm',
    prompt: 'Giữ em ở quầy, phát loa khu phố và tìm người thân.',
    rewardDiamonds: 1,
    rewardMoney: 90,
  },
  {
    id: 'vipGuest',
    name: 'Khách VIP ghé mua quà hoài niệm',
    prompt: 'Gói quà bằng giấy dó, tặng trà nóng và xin chữ ký lưu niệm.',
    rewardDiamonds: 3,
    rewardMoney: 180,
  },
];

const arcadeCatalog = [
  {
    id: 'clawMachine',
    name: 'Kho kỳ trân dị bảo',
    type: 'Sưu tầm',
    reward: 'Kỳ trân và kim cương',
    detail: 'Chọn nghiên mực cổ, sách quý hoặc ngọc tiêu để dâng Quan Văn.',
  },
  {
    id: 'brickStack',
    name: 'Sắp binh thư',
    type: 'Giải đố',
    reward: 'Sách kỹ năng và danh tiếng',
    detail: 'Sắp mệnh lệnh và trận đồ để tăng tài nguyên bồi dưỡng Quan Võ.',
  },
  {
    id: 'luckyArcade',
    name: 'Vòng quay quan lộ',
    type: 'May mắn',
    reward: 'Thẻ phút, kỳ trân hoặc vé tiến cử',
    detail: 'Dùng lượt sự kiện để nhận tài nguyên kết giao triều đình.',
  },
];

const historicalChapters = [
  {
    title: 'Bến Bạch Đằng dậy sóng',
    requirement: 'Danh tiếng 18, lòng dân 70%',
    minFame: 18,
    minPeople: 70,
    rewardMoney: 420,
    rewardFame: 4,
    rewardPeople: 3,
    lesson: 'Nắm thủy triều, chuẩn bị lương thảo và giữ lòng dân là nền của chiến thắng.',
  },
  {
    title: 'Hội Diên Hồng',
    requirement: 'Danh tiếng 25, lòng dân 76%',
    minFame: 25,
    minPeople: 76,
    rewardMoney: 560,
    rewardFame: 5,
    rewardPeople: 4,
    lesson: 'Đồng thuận cộng đồng giúp tiệm mở rộng nhanh hơn mọi chuyến buôn riêng lẻ.',
  },
  {
    title: 'Phòng tuyến Như Nguyệt',
    requirement: 'Danh tiếng 34, lòng dân 80%',
    minFame: 34,
    minPeople: 80,
    rewardMoney: 760,
    rewardFame: 6,
    rewardPeople: 4,
    lesson: 'Phòng thủ tốt cần kho ổn định, nhân sự đúng vai và thông tin rõ ràng.',
  },
  {
    title: 'Lam Sơn tụ nghĩa',
    requirement: 'Danh tiếng 44, lòng dân 84%',
    minFame: 44,
    minPeople: 84,
    rewardMoney: 980,
    rewardFame: 7,
    rewardPeople: 5,
    lesson: 'Tích lũy dài hạn, dùng tài nguyên đúng lúc và chọn người tài tạo bước nhảy.',
  },
];

const miniGameCatalog = [
  {
    id: 'millionaire',
    name: 'Ai là Trạng Nguyên',
    type: 'Đố vui',
    requirement: 'Không cạnh tranh trực tiếp',
    costTickets: 1,
    minStage: 1,
    reward: 'Đạo cụ trang trí, tiền và danh tiếng',
    detail: 'Trả lời câu hỏi lịch sử ngắn để nhận thưởng an toàn cho tân thủ.',
  },
  {
    id: 'tradeWar',
    name: 'Thương chiến bến sông',
    type: 'Cạnh tranh',
    requirement: 'Cần ít nhất 1 Quan Võ',
    costTickets: 1,
    minStage: 2,
    reward: 'Thị phần và danh tiếng',
    detail: 'Điều động Quan Võ bảo vệ thương bang và tranh thị phần với các đối thủ.',
  },
  {
    id: 'luckyWheel',
    name: 'Vòng quay lộc sử',
    type: 'May mắn',
    requirement: 'Dùng Vé tiến cử nếu còn',
    costTickets: 0,
    minStage: 1,
    reward: 'Vé tiến cử, Thẻ phút hoặc bồi dưỡng nhân sự',
    detail: 'Cơ hội chiêu mộ và tăng tốc, nhưng nên dùng khi đã có mục tiêu rõ.',
  },
  {
    id: 'fieldFishing',
    name: 'Bắt cá trên đồng',
    type: 'Cộng đồng',
    requirement: 'Lòng dân từ 72%',
    costTickets: 1,
    minStage: 2,
    reward: 'Tiền, lòng dân và nguyên liệu chợ',
    detail: 'Phối hợp dân làng đánh dấu luồng cá để đổi thưởng.',
  },
  {
    id: 'chessCart',
    name: 'Cờ xe hội làng',
    type: 'Giải đố',
    requirement: 'Danh tiếng từ 28',
    costTickets: 1,
    minStage: 3,
    reward: 'Trang trí và danh tiếng',
    detail: 'Dùng quân xe đi đúng nước trong số lượt giới hạn.',
  },
  {
    id: 'nightChef',
    name: 'Vua bếp chợ đêm',
    type: 'Vận hành',
    requirement: 'Mở Chợ đêm bến nước',
    costTickets: 1,
    minStage: 4,
    reward: 'Thu nhập/phút và lòng dân',
    detail: 'Quản lý quầy đêm, làm món nhanh và giữ khách chờ vừa đủ.',
  },
  {
    id: 'hoiVatNemCon',
    name: 'Hội Vật / Ném Còn',
    type: 'Lý - Trần',
    requirement: 'Map Lý - Trần',
    costTickets: 1,
    minStage: 1,
    era: 'lyTran',
    reward: 'Thể lực tướng và Lương Thảo',
    detail: 'Canh góc và lực để thắng hội làng, tăng sức bền Quan Võ.',
  },
  {
    id: 'thiHuong',
    name: 'Trường Thi Hương',
    type: 'Hậu Lê',
    requirement: 'Map Hậu Lê',
    costTickets: 1,
    minStage: 2,
    era: 'hauLe',
    reward: 'Bảng Vàng và Dân Trí',
    detail: 'Trắc nghiệm lịch sử, ca dao tục ngữ để quay Quan Văn.',
  },
  {
    id: 'canDoDongDem',
    name: 'Cân Đo Đong Đếm',
    type: 'Thời Nguyễn',
    requirement: 'Map Thời Nguyễn',
    costTickets: 1,
    minStage: 3,
    era: 'nguyen',
    reward: 'Lợi nhuận ngoại thương và Uy Vọng',
    detail: 'Xếp gạo, lụa, hồ tiêu lên thuyền như Tetris để tối đa lợi nhuận.',
  },
  {
    id: 'dapDeLuaNuoc',
    name: 'Thu hoạch lúa nước & đắp đê',
    type: 'Lý - Trần',
    requirement: 'Map Lý - Trần',
    costTickets: 1,
    minStage: 1,
    era: 'lyTran',
    reward: 'Lương Thảo, lòng dân và ký ức làng quê',
    detail: 'Canh nhịp nước, gặt lúa và đắp đê để giữ mùa vụ.',
  },
  {
    id: 'renThuanThien',
    name: 'Rèn kiếm Thuận Thiên',
    type: 'Hậu Lê',
    requirement: 'Map Hậu Lê',
    costTickets: 1,
    minStage: 3,
    era: 'hauLe',
    reward: 'Mảnh cổ vật, Vũ Khí và Võ uy',
    detail: 'Giữ nhiệt lò rèn để phục dựng biểu tượng khởi nghĩa Lam Sơn.',
  },
  {
    id: 'coLauTapTran',
    name: 'Cờ lau tập trận',
    type: 'Ngô - Đinh - Tiền Lê',
    requirement: 'Map Ngô - Đinh - Tiền Lê',
    costTickets: 1,
    minStage: 2,
    era: 'ngoDinhTienLe',
    reward: 'Bộ chiến, Uy Vọng và Sách kỹ năng',
    detail: 'Sắp đội hình cờ lau, luyện quân như thuở Đinh Bộ Lĩnh.',
  },
  {
    id: 'veDongHo',
    name: 'Vẽ tranh Đông Hồ',
    type: 'Văn hóa',
    requirement: 'Map Hùng Vương - Âu Lạc hoặc Lý - Trần',
    costTickets: 1,
    minStage: 1,
    reward: 'Dân Trí, Kỳ trân và lòng dân',
    detail: 'Pha màu, in tranh và mở tooltip văn hóa dân gian.',
  },
  {
    id: 'towerDefense',
    name: 'Giữ thành chống giặc',
    type: 'Tower Defense',
    requirement: 'Cần Pháo đài / Doanh trại',
    costTickets: 1,
    minStage: 3,
    reward: 'Võ uy, thị phần và cổ vật',
    detail: 'Đặt trạm cung, cọc gỗ, lò rèn để chống quân Nguyên, Thanh hoặc Pháp theo dòng ký ức.',
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
    silk: { stock: 1, shelf: 0, price: 350 },
    ink: { stock: 2, shelf: 1, price: 175 },
    pepper: { stock: 1, shelf: 0, price: 300 },
    ceramic: { stock: 1, shelf: 0, price: 260 },
    weapon: { stock: 1, shelf: 0, price: 330 },
  },
  upgrades: {
    shelf: 0,
    worker: 0,
    banner: 0,
  },
  ventures: {
    breakfast: 0,
    scriptorium: 0,
    gameRoom: 0,
    nightMarket: 0,
    netCafe: 0,
    barber: 0,
    cassetteShop: 0,
    wetRiceFarm: 0,
    academy: 0,
    fortress: 0,
  },
  personnel: {
    tranHungDao: 0,
    nguyenTrai: 0,
    dongHoArtist: 0,
    caTruSinger: 0,
    haiBaTrung: 0,
    ngoQuyen: 0,
    voNguyenGiap: 0,
    buiThiXuan: 0,
    hoiAnCaptain: 0,
    marketMatriarch: 0,
    netKeeper: 0,
    barberUncle: 0,
    cassetteCollector: 0,
  },
  assignments: {
    breakfast: '',
    scriptorium: '',
    gameRoom: '',
    nightMarket: '',
    netCafe: '',
    barber: '',
    cassetteShop: '',
    wetRiceFarm: '',
    academy: '',
    fortress: '',
  },
  artistLevels: {
    chuVanAn: 0,
    nguyenDu: 0,
    leQuyDon: 0,
    doanThiDiem: 0,
    dongHoMuse: 0,
    caiLuongIcon: 0,
    arcadeIdol: 0,
  },
  artistAffinity: {
    chuVanAn: 0,
    nguyenDu: 0,
    leQuyDon: 0,
    doanThiDiem: 0,
    dongHoMuse: 0,
    caiLuongIcon: 0,
    arcadeIdol: 0,
  },
  stage: 1,
  activeEra: 'hungAuLac',
  activeRelic: 'templeBell',
  relicFragments: 0,
  memoryThreads: 0,
  minuteCards: 4,
  inviteCards: 1,
  eventTickets: 3,
  decor: 0,
  marketShare: 0,
  cashDrops: 3,
  trash: 2,
  diamonds: 0,
  food: 320,
  weapons: 90,
  prestige: 0,
  literacy: 12,
  warMeter: 42,
  skillBooks: 6,
  breakthroughStones: 1,
  artistGifts: 3,
  goldBoards: 0,
  deployedCommanders: [],
  scholarPolicies: {
    school: 0,
    exam: 0,
    warBook: 0,
  },
  greatWorks: {
    royalCitadel: 0,
    nationalAcademy: 0,
    grandHarbor: 0,
  },
  lastGiftDay: 0,
  lastSavedAt: Date.now(),
  achievements: [],
  log: ['Trần Hưng Đạo vừa ghé tiệm, hỏi mua bản đồ sông Bạch Đằng.'],
};

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return initialGame;

    // Deep merge products to avoid missing properties (shelf, price, stock)
    const mergedProducts = {};
    productCatalog.forEach((item) => {
      const initialProd = initialGame.products[item.id];
      const savedProd = saved.products ? saved.products[item.id] : null;
      mergedProducts[item.id] = savedProd
        ? { ...initialProd, ...savedProd }
        : initialProd;
    });

    // Deep merge upgrades
    const mergedUpgrades = {};
    Object.keys(initialGame.upgrades).forEach((key) => {
      mergedUpgrades[key] = saved.upgrades && saved.upgrades[key] !== undefined
        ? saved.upgrades[key]
        : initialGame.upgrades[key];
    });

    const mergedVentures = {};
    Object.keys(initialGame.ventures).forEach((key) => {
      mergedVentures[key] = saved.ventures && saved.ventures[key] !== undefined
        ? saved.ventures[key]
        : initialGame.ventures[key];
    });

    const mergedPersonnel = {};
    Object.keys(initialGame.personnel).forEach((key) => {
      mergedPersonnel[key] = saved.personnel && saved.personnel[key] !== undefined
        ? saved.personnel[key]
        : initialGame.personnel[key];
    });

    const mergedAssignments = {};
    Object.keys(initialGame.assignments).forEach((key) => {
      mergedAssignments[key] = saved.assignments && saved.assignments[key] !== undefined
        ? saved.assignments[key]
        : initialGame.assignments[key];
    });

    const mergedArtistLevels = {};
    Object.keys(initialGame.artistLevels).forEach((key) => {
      mergedArtistLevels[key] = saved.artistLevels && saved.artistLevels[key] !== undefined
        ? saved.artistLevels[key]
        : initialGame.artistLevels[key];
    });

    const mergedArtistAffinity = {};
    Object.keys(initialGame.artistAffinity).forEach((key) => {
      mergedArtistAffinity[key] = saved.artistAffinity && saved.artistAffinity[key] !== undefined
        ? saved.artistAffinity[key]
        : initialGame.artistAffinity[key];
    });

    const mergedScholarPolicies = {};
    Object.keys(initialGame.scholarPolicies).forEach((key) => {
      mergedScholarPolicies[key] = saved.scholarPolicies && saved.scholarPolicies[key] !== undefined
        ? saved.scholarPolicies[key]
        : initialGame.scholarPolicies[key];
    });

    const mergedGreatWorks = {};
    Object.keys(initialGame.greatWorks).forEach((key) => {
      mergedGreatWorks[key] = saved.greatWorks && saved.greatWorks[key] !== undefined
        ? saved.greatWorks[key]
        : initialGame.greatWorks[key];
    });

    const hydrated = {
      ...initialGame,
      ...saved,
      products: mergedProducts,
      upgrades: mergedUpgrades,
      ventures: mergedVentures,
      personnel: mergedPersonnel,
      assignments: mergedAssignments,
      artistLevels: mergedArtistLevels,
      artistAffinity: mergedArtistAffinity,
      scholarPolicies: mergedScholarPolicies,
      greatWorks: mergedGreatWorks,
      stage: saved.stage || initialGame.stage,
      activeEra: saved.activeEra || initialGame.activeEra,
      activeRelic: saved.activeRelic || initialGame.activeRelic,
      relicFragments: saved.relicFragments ?? initialGame.relicFragments,
      memoryThreads: saved.memoryThreads ?? initialGame.memoryThreads,
      minuteCards: saved.minuteCards ?? initialGame.minuteCards,
      inviteCards: saved.inviteCards ?? initialGame.inviteCards,
      eventTickets: saved.eventTickets ?? initialGame.eventTickets,
      decor: saved.decor ?? initialGame.decor,
      marketShare: saved.marketShare ?? initialGame.marketShare,
      cashDrops: saved.cashDrops ?? initialGame.cashDrops,
      trash: saved.trash ?? initialGame.trash,
      diamonds: saved.diamonds ?? initialGame.diamonds,
      food: saved.food ?? initialGame.food,
      weapons: saved.weapons ?? initialGame.weapons,
      prestige: saved.prestige ?? initialGame.prestige,
      literacy: saved.literacy ?? initialGame.literacy,
      warMeter: saved.warMeter ?? initialGame.warMeter,
      skillBooks: saved.skillBooks ?? initialGame.skillBooks,
      breakthroughStones: saved.breakthroughStones ?? initialGame.breakthroughStones,
      artistGifts: saved.artistGifts ?? initialGame.artistGifts,
      goldBoards: saved.goldBoards ?? initialGame.goldBoards,
      deployedCommanders: saved.deployedCommanders || initialGame.deployedCommanders,
      lastGiftDay: saved.lastGiftDay ?? initialGame.lastGiftDay,
      achievements: saved.achievements || initialGame.achievements,
      log: saved.log || initialGame.log,
    };
    const elapsedMinutes = Math.min(
      180,
      Math.floor((Date.now() - (saved.lastSavedAt || Date.now())) / 60000),
    );
    if (elapsedMinutes > 0) {
      const offlineMoney = Math.round(incomePerMinute(hydrated) * elapsedMinutes * 0.55);
      return pushLog(
        { ...hydrated, money: hydrated.money + offlineMoney, lastSavedAt: Date.now() },
        `Tiệm tự thu ${offlineMoney.toLocaleString('vi-VN')}đ trong ${elapsedMinutes} phút vắng mặt.`,
      );
    }
    return hydrated;
  } catch {
    return initialGame;
  }
}

function App() {
  const [game, setGame] = useState(loadGame);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('manage');
  const [pulse, setPulse] = useState('manage');
  const [checkpoints, setCheckpoints] = useState(loadCheckpoints);
  const [eventToast, setEventToast] = useState(null);

  const customer = customerQueue[game.customerIndex % customerQueue.length];
  const totalStock = productCatalog.reduce((sum, item) => sum + game.products[item.id].stock, 0);
  const totalShelf = productCatalog.reduce((sum, item) => sum + game.products[item.id].shelf, 0);
  const shelfCapacity = 6 + game.upgrades.shelf * 2;
  const passiveIncome = incomePerMinute(game);
  const latestMessage = game.log[0] || '';

  const unlocks = useMemo(() => {
    const next = [];
    if (game.money >= 1600 && !game.achievements.includes('Bạc đầy tráp')) next.push('Bạc đầy tráp');
    if (game.fame >= 28 && !game.achievements.includes('Tiệm vang bến sông')) next.push('Tiệm vang bến sông');
    if (game.people >= 82 && !game.achievements.includes('Lòng dân quy tụ')) next.push('Lòng dân quy tụ');
    if (game.stage >= 3 && !game.achievements.includes('Qua ba ải sử')) next.push('Qua ba ải sử');
    if (Object.values(game.personnel).some((level) => level >= 3) && !game.achievements.includes('Danh sĩ trợ tiệm')) {
      next.push('Danh sĩ trợ tiệm');
    }
    return next;
  }, [game.money, game.fame, game.people, game.stage, game.personnel, game.achievements]);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...game, lastSavedAt: Date.now() }));
    // Tự lưu checkpoint mỗi 5 ngày
    if (game.day % 5 === 0 && game.day > 0) {
      saveCheckpoint(game);
      setCheckpoints(loadCheckpoints());
    }
  }, [game]);

  useEffect(() => {
    if (!unlocks.length) return;
    setGame((current) => {
      const updated = {
        ...current,
        achievements: [...current.achievements, ...unlocks],
        log: [`Mở thành tựu: ${unlocks.join(', ')}.`, ...current.log].slice(0, 6),
      };
      // Lưu checkpoint khi mở thành tựu
      saveCheckpoint(updated);
      setCheckpoints(loadCheckpoints());
      return updated;
    });
  }, [unlocks]);

  useEffect(() => {
    if (!game.upgrades.worker && passiveIncome <= 0) return undefined;
    const timer = window.setInterval(() => {
      setGame((current) => {
        let updated = {
          ...current,
          money: current.money + Math.max(1, Math.round(incomePerMinute(current) / 6)),
        };
        if (current.upgrades.worker) {
          const item = productCatalog.find((product) => current.products[product.id].shelf > 0);
          if (item) updated = sellProduct(updated, item.id, true);
        }
        return updated;
      });
    }, 10000);
    return () => window.clearInterval(timer);
  }, [game.upgrades.worker, passiveIncome]);

  const handleAction = (actionId) => {
    setPulse(actionId);
    setActivePanel(actionId);
    setLedgerOpen(false);
    setDialogOpen(true);
    return;

    if (actionId === 'history') {
      setLedgerOpen(true);
      setDialogOpen(false);
      return;
    }

    setLedgerOpen(false);
    setDialogOpen(true);

    if (actionId === 'sell') {
      setGame((current) => {
        const result = sellProduct(current, customer.wants, false);
        // Hiện toast sự kiện lịch sử nếu có
        if (result.__triggeredEvent) {
          const evt = result.__triggeredEvent;
          delete result.__triggeredEvent;
          setEventToast(evt);
          setTimeout(() => setEventToast(null), 3200);
        }
        return result;
      });
    }
  };

  const runRestock = () => setGame((current) => restock(current));
  const runDisplay = () => setGame((current) => displayGoods(current));
  const runMinuteCard = () => setGame((current) => useMinuteCards(current));
  const runChapter = () => setGame((current) => clearHistoricalChapter(current));
  const runMiniGame = (miniGameId) => setGame((current) => playMiniGame(current, miniGameId));
  const runTimeTravel = () => {
    setGame((current) => {
      const result = openTimeGate(current);
      if (result.__triggeredEvent) {
        const evt = result.__triggeredEvent;
        delete result.__triggeredEvent;
        setEventToast(evt);
        setTimeout(() => setEventToast(null), 3200);
      }
      return result;
    });
  };
  const runDailyGift = () => setGame((current) => claimDailyGift(current));
  const runSell = () => {
    setPulse('manage');
    setActivePanel('manage');
    setLedgerOpen(false);
    setDialogOpen(true);
    setGame((current) => {
      const result = sellProduct(current, customer.wants, false);
      if (result.__triggeredEvent) {
        const evt = result.__triggeredEvent;
        delete result.__triggeredEvent;
        setEventToast(evt);
        setTimeout(() => setEventToast(null), 3200);
      }
      return result;
    });
  };
  const runCleanStore = () => setGame((current) => cleanStore(current));
  const runCollectCash = () => setGame((current) => collectCashDrops(current));
  const runCustomerIncident = () => setGame((current) => resolveCustomerIncident(current));
  const runArcade = (arcadeId) => setGame((current) => playArcadeGame(current, arcadeId));
  const assignTalent = (ventureId) => setGame((current) => assignTalentToVenture(current, ventureId));
  const interactArtist = (artistId, mode) => setGame((current) => interactWithArtist(current, artistId, mode));
  const switchEra = (eraId) => setGame((current) => travelToEra(current, eraId));
  const runPeaceHarvest = () => setGame((current) => harvestPeaceResources(current));
  const runHistoricalCrisis = () => setGame((current) => resolveHistoricalCrisis(current));
  const runScholarPolicy = (policyId) => setGame((current) => enactScholarPolicy(current, policyId));
  const investGreatWork = (workId) => setGame((current) => investInGreatWork(current, workId));
  const toggleCommanderDeployment = (personId) => setGame((current) => toggleDeployment(current, personId));
  const chooseRelic = (relicId) => setGame((current) => chooseTimeRelic(current, relicId));
  const openLedger = () => {
    setPulse('manage');
    setLedgerOpen(true);
    setDialogOpen(false);
  };

  const buyUpgrade = (upgradeId) => {
    setPulse('manage');
    setActivePanel('manage');
    setLedgerOpen(false);
    setDialogOpen(true);
    setGame((current) => {
      const upgrade = upgradeCatalog.find((item) => item.id === upgradeId);
      const owned = current.upgrades[upgradeId];
      const cost = Math.round(upgrade.cost * (1 + owned * 0.65) * constructionDiscount(current));
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

  const investVenture = (ventureId) => {
    setPulse('sell');
    setActivePanel('sell');
    setLedgerOpen(false);
    setDialogOpen(true);
    setGame((current) => buyVenture(current, ventureId));
  };

  const trainPersonnel = (personId) => {
    setPulse('talent');
    setActivePanel('talent');
    setLedgerOpen(false);
    setDialogOpen(true);
    setGame((current) => recruitOrTrainPersonnel(current, personId));
  };

  const resetSave = () => {
    localStorage.removeItem(SAVE_KEY);
    setGame(initialGame);
    setActivePanel('manage');
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
              <p>Ký Ức Ngàn Năm</p>
              <h1>Thời Gian Đại Việt</h1>
            </div>
          </div>
          <div className="resource-grid" aria-label="Tài nguyên">
            <Stat label="Tiền" value={`${game.money.toLocaleString('vi-VN')}đ`} />
            <Stat label="Lòng dân" value={`${game.people}%`} />
            <Stat label="Danh tiếng" value={game.fame} />
            <Stat label="Kim cương" value={game.diamonds || 0} />
            <Stat label="Thu/phút" value={`${passiveIncome.toLocaleString('vi-VN')}đ`} />
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

          {eventToast && (
            <div className="event-toast">
              <strong>{eventToast.name}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>{eventToast.effect}</p>
            </div>
          )}

          <StatusPanel
            activePanel={activePanel}
            customer={customer}
            game={game}
            shelfCapacity={shelfCapacity}
            passiveIncome={passiveIncome}
            onRestock={runRestock}
            onDisplay={runDisplay}
            onUseMinuteCard={runMinuteCard}
            onClearChapter={runChapter}
            onPlayMiniGame={runMiniGame}
            onTimeTravel={runTimeTravel}
            onDailyGift={runDailyGift}
            onSell={runSell}
            onCleanStore={runCleanStore}
            onCollectCash={runCollectCash}
            onCustomerIncident={runCustomerIncident}
            onPlayArcade={runArcade}
            onAssignTalent={assignTalent}
            onInteractArtist={interactArtist}
            onSwitchEra={switchEra}
            onPeaceHarvest={runPeaceHarvest}
            onResolveCrisis={runHistoricalCrisis}
            onScholarPolicy={runScholarPolicy}
            onInvestGreatWork={investGreatWork}
            onToggleDeployment={toggleCommanderDeployment}
            onChooseRelic={chooseRelic}
            onOpenLedger={openLedger}
            buyUpgrade={buyUpgrade}
            investVenture={investVenture}
            trainPersonnel={trainPersonnel}
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
              <h2>Cẩm nang tân thủ</h2>
              <div className="guide-list">
                <p>Ưu tiên: vượt ải sử, nâng Quan Võ chủ lực, rồi mới mở rộng cơ sở nặng trong khu phố.</p>
                <p>Giữ Thẻ phút đến khi thu nhập/phút đủ cao; dùng quá sớm sẽ phí tài nguyên.</p>
                <p>Không đổ hết tiền vào nâng cấp tự động nếu kho, kệ và lòng dân chưa ổn định.</p>
                <p>Quan Võ quý hiếm ưu tiên tối đa; Quan Văn chủ lực cần tăng Uy vọng để mở đặc quyền giảm thuế và buff Văn Võ song toàn.</p>
                <p>Mỗi ngày hãy nhận quà, mở cổng thời gian đúng lúc và dùng lượt sự kiện cho mini-game phù hợp.</p>
              </div>
              <h2>Điểm lưu</h2>
              {checkpoints.length === 0 ? (
                <p>Chưa có điểm lưu. Cứ mỗi 5 ngày sẽ tự lưu.</p>
              ) : (
                <div className="checkpoint-list">
                  {checkpoints.map((cp) => (
                    <button key={cp.id} type="button" onClick={() => { loadCheckpoint(cp.id, setGame); setLedgerOpen(false); }}>
                      Ngày {cp.day}/{cp.year} — {cp.money.toLocaleString('vi-VN')}đ · Danh tiếng {cp.fame}
                    </button>
                  ))}
                </div>
              )}
              <h2>Vật trong phòng</h2>
              <p>{roomObjects.map((item) => `${item.name} L${item.layer}`).join(' · ')}</p>
            </aside>
          )}
        </section>

        <nav className="bottom-nav" aria-label="Thao tác tiệm">
          {navigationActions.map((action) => (
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

function StatusPanel({
  activePanel,
  customer,
  game,
  shelfCapacity,
  passiveIncome,
  onRestock,
  onDisplay,
  onUseMinuteCard,
  onClearChapter,
  onPlayMiniGame,
  onTimeTravel,
  onDailyGift,
  onSell,
  onCleanStore,
  onCollectCash,
  onCustomerIncident,
  onPlayArcade,
  onAssignTalent,
  onInteractArtist,
  onSwitchEra,
  onPeaceHarvest,
  onResolveCrisis,
  onScholarPolicy,
  onInvestGreatWork,
  onToggleDeployment,
  onChooseRelic,
  onOpenLedger,
  buyUpgrade,
  investVenture,
  trainPersonnel,
}) {
  const talentCards = personnelCards().filter((person) => person.kind === 'Quan Võ');
  const chapter = currentChapter(game);
  const activeEra = currentEra(game);
  const crisis = currentCrisis(game);
  const activeRelic = currentRelic(game);

  if (activePanel === 'manage') {
    const nextIncident = customerIncidents[(game.day + game.customerIndex) % customerIncidents.length];
    return (
      <aside className="management-panel">
        <h2>{activeEra.mapName}</h2>
        <div className="economy-strip">
          <span>{activeEra.name}</span>
          <span>Kho {totalStockOf(game)}</span>
          <span>Lương {game.food || 0}</span>
          <span>Vũ khí {game.weapons || 0}</span>
          <span>Biến cố {game.warMeter || 0}%</span>
          <span>Dân Trí {game.literacy || 0}</span>
        </div>
        <article className="era-card">
          <strong>Cây Đa Làng - Trục Thời Gian</strong>
          <span>{activeEra.architecture}</span>
          <small>{activeEra.bonus}</small>
          <div className="timeline-strip">
            {eraCatalog.map((era) => (
              <button
                type="button"
                key={era.id}
                className={game.activeEra === era.id ? 'active' : ''}
                disabled={game.stage < era.unlockStage}
                onClick={() => onSwitchEra(era.id)}
              >
                {game.stage < era.unlockStage ? `${era.name} · ải ${era.unlockStage}` : era.name}
              </button>
            ))}
          </div>
        </article>
        <article className="story-card">
          <strong>{gameNameIdeas[game.day % gameNameIdeas.length]}</strong>
          <span>Hậu duệ thời hiện đại giữ {activeRelic.name}, dựng chuỗi cơ sở văn hóa - kinh tế - quân sự qua các triều đại.</span>
          <small>{activeRelic.effect}</small>
          <div className="relic-strip">
            {relicCatalog.map((relic) => (
              <button
                type="button"
                key={relic.id}
                className={game.activeRelic === relic.id ? 'active' : ''}
                onClick={() => onChooseRelic(relic.id)}
              >
                {relic.name}
              </button>
            ))}
          </div>
        </article>
        <div className="loop-grid">
          <button type="button" onClick={onPeaceHarvest}>
            <strong>Ngụ binh ư nông</strong>
            <span>Thu lương, rèn khí, tích lực</span>
          </button>
          <button type="button" onClick={onCleanStore}>
            <strong>Dọn tiệm</strong>
            <span>Gom rác, giữ lòng dân</span>
          </button>
          <button type="button" onClick={onRestock}>
            <strong>Nhập hàng</strong>
            <span>Bổ sung kho</span>
          </button>
          <button type="button" onClick={onDisplay}>
            <strong>Bày kệ</strong>
            <span>Đưa hàng ra bán</span>
          </button>
          <button type="button" onClick={onSell}>
            <strong>Bán hàng</strong>
            <span>Tính tiền cho {customer.name}</span>
          </button>
          <button type="button" onClick={onCollectCash}>
            <strong>Thu tiền rơi</strong>
            <span>Tap coin trên sàn</span>
          </button>
          <button type="button" onClick={onCustomerIncident}>
            <strong>Xử lý khách</strong>
            <span>{nextIncident.name}</span>
          </button>
          <button type="button" onClick={onUseMinuteCard}>
            <strong>Thẻ phút</strong>
            <span>{game.minuteCards} thẻ đang có</span>
          </button>
          <button type="button" onClick={onOpenLedger}>
            <strong>Sổ sử</strong>
            <span>Ghi chép và cẩm nang</span>
          </button>
        </div>
        <p className="mentor-tip">
          Giai đoạn đầu cần tap để dọn, nhập, bày và bán. Khi đã chiêu mộ Quan Võ, hãy sang Khu phố để bổ nhiệm quản lý cơ sở nặng và tự động hóa doanh thu offline.
        </p>
      </aside>
    );
  }

  if (activePanel === 'sell') {
    return (
      <aside className="management-panel">
        <h2>Khu phố: cơ sở nặng & đại công trình</h2>
        <div className="economy-strip">
          <span>Thu/phút {passiveIncome.toLocaleString('vi-VN')}đ</span>
          <span>Thị phần {game.marketShare || 0}%</span>
          <span>Lương {game.food || 0}</span>
          <span>Vũ khí {game.weapons || 0}</span>
          <span>Uy Vọng {game.prestige || 0}</span>
          <span>Giảm xây {Math.round((1 - constructionDiscount(game)) * 100)}%</span>
        </div>
        <article className="era-card compact-era">
          <strong>{activeEra.name}: {activeEra.focus}</strong>
          <span>{activeEra.architecture}</span>
        </article>
        <div className="city-grid">
          {ventureCatalog.map((venture) => {
            const owned = game.ventures[venture.id] || 0;
            const cost = Math.round(venture.cost * (1 + owned * 0.75) * constructionDiscount(game));
            const locked = game.stage < venture.unlockStage;
            const assigned = assignedTalentName(game, venture.id);
            const multiplier = ventureAssignmentMultiplier(game, venture);
            return (
              <article className="city-card" key={venture.id}>
                <div>
                  <strong>{venture.name}</strong>
                  <span>{locked ? `Mở ở ải ${venture.unlockStage}` : `Cấp ${owned} · x${multiplier.toFixed(1)} doanh thu`}</span>
                  <small>Slot {ventureSpecialtyLabel(venture)}: {assigned}</small>
                </div>
                <div className="city-card-actions">
                  <button type="button" onClick={() => investVenture(venture.id)} disabled={locked}>
                    Đầu tư {cost.toLocaleString('vi-VN')}đ
                  </button>
                  <button type="button" onClick={() => onAssignTalent(venture.id)} disabled={locked || !talentCards.some((person) => (game.personnel[person.id] || 0) > 0)}>
                    Bổ nhiệm
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="great-work-grid">
          {greatWorkCatalog.map((work) => {
            const level = game.greatWorks?.[work.id] || 0;
            const costText = formatGreatWorkCost(work, level);
            return (
              <article className="city-card" key={work.id}>
                <div>
                  <strong>{work.name}</strong>
                  <span>Cấp {level} · Resource Sink dài hạn</span>
                  <small>{work.effect}</small>
                  <small>{costText}</small>
                </div>
                <div className="city-card-actions">
                  <button type="button" onClick={() => onInvestGreatWork(work.id)}>
                    Đầu tư đại công trình
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    );
  }

  if (activePanel === 'talent') {
    return (
      <aside className="management-panel">
        <h2>Quan Võ: tiền tuyến và chuỗi cung ứng</h2>
        <div className="economy-strip">
          <span>Sách kỹ năng {game.skillBooks || 0}</span>
          <span>Đá đột phá {game.breakthroughStones || 0}</span>
          <span>Võ uy {negotiationPower(game)}</span>
          <span>Vé tiến cử {game.inviteCards}</span>
        </div>
        <div className="personnel-list">
          {talentCards.map((person) => {
            const level = game.personnel[person.id] || 0;
            const stats = talentStats(person, level, game);
            const deployed = game.deployedCommanders?.includes(person.id);
            return (
              <article className="artist-card talent-card" key={person.id}>
                <div>
                  <strong>{person.name}</strong>
                  <span>
                    <i className={`rarity-badge ${rarityClass(person.rarity)}`}>{person.rarity}</i>
                    cấp {level}/{person.maxLevel} · {eraLabel(person.era)}
                  </span>
                  <small>{person.target}</small>
                  <small>{formatTalentStats(stats)}</small>
                  <small>{deployed ? 'Đang rút khỏi xưởng để xuất chinh' : eraFitText(game, person)}</small>
                </div>
                <div className="artist-actions">
                  <button type="button" onClick={() => trainPersonnel(person.id)}>Bồi dưỡng</button>
                  <button type="button" onClick={() => onToggleDeployment(person.id)} disabled={level <= 0}>
                    {deployed ? 'Về xưởng' : 'Xuất chinh'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    );
  }

  if (activePanel === 'history') {
    return (
      <aside className="management-panel">
        <h2>Quan Văn: uy vọng và chính sách hậu phương</h2>
        <div className="economy-strip">
          <span>Kỳ trân {game.artistGifts || 0}</span>
          <span>Uy vọng {artistPower(game)}</span>
          <span>Đặc quyền x{artistChainBoost(game).toFixed(2)}</span>
          <span>Kim cương {game.diamonds || 0}</span>
          <span>Dân Trí {game.literacy || 0}</span>
          <span>Bảng Vàng {game.goldBoards || 0}</span>
        </div>
        <div className="policy-grid">
          <button type="button" onClick={() => onScholarPolicy('school')}>
            <strong>Mở trường Thầy Đồ</strong>
            <span>Dân Trí +, giảm chi phí xây</span>
          </button>
          <button type="button" onClick={() => onScholarPolicy('exam')}>
            <strong>Mở Khoa Thi</strong>
            <span>Bảng Vàng, vé tiến cử</span>
          </button>
          <button type="button" onClick={() => onScholarPolicy('warBook')}>
            <strong>Biên soạn Binh Thư</strong>
            <span>Buff Quan Võ, giảm hao lương</span>
          </button>
        </div>
        <div className="artist-list">
          {artistCatalog.map((artist) => {
            const level = game.artistLevels?.[artist.id] || 0;
            const affinity = game.artistAffinity?.[artist.id] || 0;
            return (
              <article className="artist-card" key={artist.id}>
                <div>
                  <strong>{artist.name}</strong>
                  <span>
                    <i className={`rarity-badge ${rarityClass(artist.rarity)}`}>{artist.rarity}</i>
                    cấp {level} · tín nhiệm {affinity}
                  </span>
                  <small>Liên kết: {artistLinkedNames(artist)}</small>
                  <small>{artist.role}</small>
                </div>
                <div className="artist-actions">
                  <button type="button" onClick={() => onInteractArtist(artist.id, 'gift')}>Dâng kỳ trân</button>
                  <button type="button" onClick={() => onInteractArtist(artist.id, 'chat')}>Đàm đạo</button>
                  <button type="button" onClick={() => onInteractArtist(artist.id, 'meet')}>Yết kiến</button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mini-game-list">
          {arcadeCatalog.map((arcade) => (
            <button type="button" key={arcade.id} onClick={() => onPlayArcade(arcade.id)}>
              <strong>{arcade.name}</strong>
              <span>{arcade.type} · {arcade.reward}</span>
              <small>{arcade.detail}</small>
            </button>
          ))}
        </div>
      </aside>
    );
  }

  if (activePanel === 'quest') {
    const power = negotiationPower(game);
    const requirement = negotiationRequirement(game, chapter);
    return (
      <aside className="management-panel">
        <h2>Thương lộ: vượt ải và thương lượng</h2>
        <article className="quest-card">
          <strong>Ải {game.stage}: {chapter.title}</strong>
          <span>{chapter.requirement} · cần lực {requirement}</span>
          <p>{chapter.lesson}</p>
        </article>
        <div className="power-strip">
          <span>Võ uy {power}</span>
          <span>NPC {requirement}</span>
          <span>Thị phần {game.marketShare || 0}%</span>
          <span>Lương {game.food || 0}</span>
          <span>Vũ khí {game.weapons || 0}</span>
          <span>Biến cố {game.warMeter || 0}%</span>
        </div>
        <article className="crisis-card">
          <strong>{crisis.name}</strong>
          <span>{crisis.threat}</span>
          <small>{game.warMeter >= 100 ? 'Biến cố đã đầy: cần rút Quan Võ khỏi xưởng để xuất chinh.' : `Còn ${100 - (game.warMeter || 0)}% để kích hoạt biến cố lịch sử.`}</small>
          <small>Phần thưởng: {crisis.reward}</small>
        </article>
        <div className="panel-action-row">
          <button type="button" onClick={onClearChapter}>Thương lượng</button>
          <button type="button" onClick={onResolveCrisis}>Xuất chinh</button>
          <button type="button" onClick={onDailyGift}>Quà ngày</button>
        </div>
        <div className="mini-game-list">
          {miniGameCatalog.map((miniGame) => {
            const gate = canEnterMiniGame(game, miniGame);
            return (
              <button
                type="button"
                key={miniGame.id}
                onClick={() => onPlayMiniGame(miniGame.id)}
                disabled={!gate.ok}
              >
                <strong>{miniGame.name}</strong>
                <span>{gate.ok ? `${miniGame.type} · ${miniGame.reward}` : gate.reason}</span>
                <small>{miniGame.detail}</small>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  if (activePanel === 'manage') {
    return (
      <aside className="management-panel">
        <h2>Quản lý & phát triển</h2>
        <div className="economy-strip">
          <span>Kho {totalStockOf(game)}</span>
          <span>Kệ {totalShelfOf(game)}/{shelfCapacity}</span>
          <span>Thẻ phút {game.minuteCards}</span>
          <span>Vé tiến cử {game.inviteCards}</span>
          <span>Lượt sự kiện {game.eventTickets}</span>
          <span>Trang trí {game.decor}</span>
        </div>
        <div className="category-grid">
          {stockByCategory(game).map((item) => (
            <span key={item.category}>{item.category}: {item.stock}</span>
          ))}
        </div>
        <div className="panel-action-row">
          <button type="button" onClick={onRestock}>Nhập hàng</button>
          <button type="button" onClick={onDisplay}>Bày kệ</button>
          <button type="button" onClick={onUseMinuteCard}>Dùng thẻ phút</button>
        </div>
        <p className="mentor-tip">
          Thu nhập mỗi phút hiện là {passiveIncome.toLocaleString('vi-VN')}đ. Nên giữ thẻ phút đến khi dòng tiền mạnh.
        </p>
        <div className="upgrade-list compact-list">
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
          {ventureCatalog.map((venture) => {
            const owned = game.ventures[venture.id];
            const cost = Math.round(venture.cost * (1 + owned * 0.75));
            const locked = game.stage < venture.unlockStage;
            return (
              <button type="button" key={venture.id} onClick={() => investVenture(venture.id)} disabled={locked}>
                <strong>{venture.name}</strong>
                <span>{locked ? `Mở ở ải ${venture.unlockStage}` : `${cost.toLocaleString('vi-VN')}đ · cấp ${owned}`}</span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  if (activePanel === 'quest') {
    const chapter = currentChapter(game);
    return (
      <aside className="management-panel">
        <h2>Ải sử & du hành</h2>
        <article className="quest-card">
          <strong>Ải {game.stage}: {chapter.title}</strong>
          <span>{chapter.requirement}</span>
          <p>{chapter.lesson}</p>
        </article>
        <div className="panel-action-row">
          <button type="button" onClick={onClearChapter}>Vượt ải</button>
          <button type="button" onClick={onTimeTravel}>Cổng thời gian</button>
          <button type="button" onClick={onDailyGift}>Quà ngày</button>
        </div>
        <p className="mentor-tip">
          Vượt ải mở mô hình mới, nhận thẻ phút và vé tiến cử. Cổng thời gian tạo biến cố để tối ưu tiến trình.
        </p>
        <div className="mini-game-list">
          {miniGameCatalog.map((miniGame) => {
            const locked = !canEnterMiniGame(game, miniGame).ok;
            return (
              <button
                type="button"
                key={miniGame.id}
                onClick={() => onPlayMiniGame(miniGame.id)}
                disabled={locked}
              >
                <strong>{miniGame.name}</strong>
                <span>{locked ? canEnterMiniGame(game, miniGame).reason : `${miniGame.type} · ${miniGame.reward}`}</span>
                <small>{miniGame.detail}</small>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  if (activePanel === 'talent') {
    return (
      <aside className="management-panel">
        <h2>Quan Võ & Quan Văn</h2>
        <div className="personnel-list">
          {personnelCatalog.map((person) => {
            const level = game.personnel[person.id];
            return (
              <button type="button" key={person.id} onClick={() => trainPersonnel(person.id)}>
                <strong>{person.name}</strong>
                <span>{person.kind} · {person.rarity} · cấp {level}/{person.maxLevel}</span>
                <em>{person.target}</em>
                <small>{person.effect}</small>
              </button>
            );
          })}
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

function incomePerMinute(game) {
  const ventureIncome = ventureCatalog.reduce((sum, venture) => {
    const level = game.ventures?.[venture.id] || 0;
    return sum + Math.round(level * venture.income * ventureAssignmentMultiplier(game, venture));
  }, 0);
  const shopIncome = Math.round(
    game.level * 16
      + game.fame * 3
      + game.people * 1.5
      + totalShelfOf(game) * 8
      + (game.decor || 0) * 9
      + (game.marketShare || 0) * 4,
  );
  const talentBoost = 1 + personnelPower(game, 'Quan Võ') * 0.035 + artistCharm(game) * 0.025;
  const eraBoost = 1 + (game.greatWorks?.grandHarbor || 0) * 0.04 + (game.literacy || 0) * 0.002;
  return Math.max(60, Math.round((shopIncome + ventureIncome) * talentBoost * artistChainBoost(game) * eraBoost));
}

function personnelPower(game, kind) {
  return personnelCards()
    .filter((person) => person.kind === kind)
    .reduce((sum, person) => sum + (game.personnel?.[person.id] || 0), 0);
}

function artistCharm(game) {
  return personnelPower(game, 'Quan Văn') + artistPower(game);
}

function currentChapter(game) {
  if (game.stage <= historicalChapters.length) {
    return historicalChapters[game.stage - 1];
  }
  const extra = game.stage - historicalChapters.length;
  return {
    title: `Thương chiến bến sông ${extra}`,
    requirement: `Danh tiếng ${44 + extra * 4}, lòng dân 84%`,
    minFame: 44 + extra * 4,
    minPeople: 84,
    rewardMoney: 980 + extra * 160,
    rewardFame: 5,
    rewardPeople: 3,
    lesson: 'Sau khi qua các mốc lớn, hãy tối ưu mạng lưới cửa tiệm, kết giao Quan Văn và tranh thị phần bằng Quan Võ.',
  };
}

function clearHistoricalChapter(current) {
  const chapter = currentChapter(current);
  if (current.fame < chapter.minFame || current.people < chapter.minPeople) {
    return pushLog(current, `Chưa đủ điều kiện vượt ải ${current.stage}: cần ${chapter.requirement}.`);
  }
  const power = negotiationPower(current);
  const requiredPower = negotiationRequirement(current, chapter);
  if (power < requiredPower) {
    return pushLog(current, `Thương lượng thất bại: Võ uy ${power}, đối thủ cần ${requiredPower}. Hãy nâng Quan Võ hoặc kết giao Quan Văn.`);
  }
  const talentBonus = personnelPower(current, 'Quan Võ');
  const rewardMoney = Math.round(chapter.rewardMoney * (1 + talentBonus * 0.08));
  return pushLog(
    {
      ...current,
      stage: current.stage + 1,
      day: current.day + 1,
      money: current.money + rewardMoney,
      fame: current.fame + chapter.rewardFame + Math.min(3, talentBonus),
      people: Math.min(100, current.people + chapter.rewardPeople),
      minuteCards: current.minuteCards + 2,
      inviteCards: current.inviteCards + 1,
      marketShare: Math.min(100, (current.marketShare || 0) + 3 + Math.min(6, talentBonus)),
    },
    `Thương lượng thắng "${chapter.title}". Nhận ${rewardMoney.toLocaleString('vi-VN')}đ, 2 Thẻ phút, 1 Vé tiến cử và thêm thị phần.`,
  );
}

function openTimeGate(current) {
  if (current.minuteCards <= 0) return pushLog(current, 'Cổng thời gian cần ít nhất 1 Thẻ phút để kích hoạt.');
  const event = historicalEvents[Math.floor(Math.random() * historicalEvents.length)];
  let result = event.apply({ ...current, minuteCards: current.minuteCards - 1, day: current.day + 1 });
  result = pushLog(result, `Mở cổng thời gian: ${event.name}. ${event.effect}`);
  result.__triggeredEvent = event;
  return result;
}

function claimDailyGift(current) {
  if (current.lastGiftDay === current.day) return pushLog(current, 'Quà ngày hôm nay đã nhận rồi.');
  const reward = 180 + current.stage * 60 + Math.round(incomePerMinute(current) * 0.6);
  return pushLog(
    {
      ...current,
      money: current.money + reward,
      minuteCards: current.minuteCards + 1,
      inviteCards: current.inviteCards + (current.day % 4 === 0 ? 1 : 0),
      eventTickets: current.eventTickets + 2,
      skillBooks: (current.skillBooks || 0) + 1,
      artistGifts: (current.artistGifts || 0) + 1,
      lastGiftDay: current.day,
    },
    `Nhận quà ngày: ${reward.toLocaleString('vi-VN')}đ, 1 Thẻ phút, 2 lượt sự kiện, Sách kỹ năng và Kỳ trân.`,
  );
}

function useMinuteCards(current) {
  if (current.minuteCards <= 0) return pushLog(current, 'Bạn chưa có Thẻ phút.');
  const income = incomePerMinute(current);
  if (income < 220) {
    return pushLog(current, 'Khoan dùng Thẻ phút: thu nhập/phút còn thấp, hãy nâng tiệm hoặc Quan Võ trước.');
  }
  const uses = Math.min(5, current.minuteCards);
  const reward = income * uses;
  return pushLog(
    {
      ...current,
      money: current.money + reward,
      minuteCards: current.minuteCards - uses,
    },
    `Dùng ${uses} Thẻ phút, nhận ${reward.toLocaleString('vi-VN')}đ theo thu nhập hiện tại.`,
  );
}

function buyVenture(current, ventureId) {
  const venture = ventureCatalog.find((item) => item.id === ventureId);
  if (!venture) return current;
  if (current.stage < venture.unlockStage) return pushLog(current, `${venture.name} mở khi đạt ải ${venture.unlockStage}.`);
  const owned = current.ventures[ventureId] || 0;
  const cost = Math.round(venture.cost * (1 + owned * 0.75) * constructionDiscount(current));
  if (current.money < cost) return pushLog(current, `Chưa đủ tiền đầu tư ${venture.name}.`);
  return pushLog(
    {
      ...current,
      money: current.money - cost,
      fame: current.fame + 2,
      people: Math.min(100, current.people + 1),
      ventures: { ...current.ventures, [ventureId]: owned + 1 },
    },
    `Đầu tư ${venture.name} cấp ${owned + 1}. ${venture.detail}`,
  );
}

function canEnterMiniGame(game, miniGame) {
  if (game.stage < miniGame.minStage) return { ok: false, reason: `Mở ở ải ${miniGame.minStage}` };
  if (miniGame.era && game.activeEra !== miniGame.era) {
    return { ok: false, reason: `Cần map ${eraLabel(miniGame.era)}` };
  }
  if (miniGame.costTickets > 0 && game.eventTickets < miniGame.costTickets) {
    return { ok: false, reason: 'Thiếu lượt sự kiện' };
  }
  if (miniGame.id === 'tradeWar' && personnelPower(game, 'Quan Võ') <= 0) {
    return { ok: false, reason: 'Cần 1 Quan Võ' };
  }
  if (miniGame.id === 'fieldFishing' && game.people < 72) return { ok: false, reason: 'Cần lòng dân 72%' };
  if (miniGame.id === 'chessCart' && game.fame < 28) return { ok: false, reason: 'Cần danh tiếng 28' };
  if (miniGame.id === 'nightChef' && (game.ventures?.nightMarket || 0) <= 0) {
    return { ok: false, reason: 'Cần Chợ đêm' };
  }
  if (miniGame.id === 'towerDefense' && (game.ventures?.fortress || 0) <= 0) {
    return { ok: false, reason: 'Cần Pháo đài' };
  }
  if (miniGame.id === 'luckyWheel' && game.inviteCards <= 0 && game.minuteCards <= 0) {
    return { ok: false, reason: 'Cần vé hoặc thẻ' };
  }
  return { ok: true, reason: '' };
}

function playMiniGame(current, miniGameId) {
  const miniGame = miniGameCatalog.find((item) => item.id === miniGameId);
  if (!miniGame) return current;
  const gate = canEnterMiniGame(current, miniGame);
  if (!gate.ok) return pushLog(current, `${miniGame.name}: ${gate.reason}.`);

  const talent = personnelPower(current, 'Quan Võ');
  const artists = personnelPower(current, 'Quan Văn') + artistPower(current);
  const base = incomePerMinute(current);
  const ticketCost = miniGame.costTickets || 0;
  let next = {
    ...current,
    eventTickets: Math.max(0, current.eventTickets - ticketCost),
    day: current.day + (miniGame.id === 'luckyWheel' ? 0 : 1),
  };

  if (miniGame.id === 'millionaire') {
    const reward = Math.round(base * 1.35 + 90 * current.stage);
    next = {
      ...next,
      money: next.money + reward,
      fame: next.fame + 2 + Math.min(2, talent),
      decor: next.decor + 1,
    };
    return pushLog(next, `Thắng ${miniGame.name}: nhận ${reward.toLocaleString('vi-VN')}đ và 1 món trang trí.`);
  }

  if (miniGame.id === 'tradeWar') {
    const reward = Math.round(base * (1.6 + talent * 0.16));
    next = {
      ...next,
      money: next.money + reward,
      fame: next.fame + 3 + talent,
      marketShare: Math.min(100, next.marketShare + 4 + talent),
      people: Math.max(0, Math.min(100, next.people - 1 + Math.min(3, artists))),
    };
    return pushLog(next, `Thương chiến thắng lợi: thị phần +${4 + talent}, nhận ${reward.toLocaleString('vi-VN')}đ.`);
  }

  if (miniGame.id === 'luckyWheel') {
    const useInvite = current.inviteCards > 0;
    const luckyIndex = (current.day + current.fame + current.minuteCards + current.inviteCards) % 4;
    next = {
      ...next,
      inviteCards: useInvite ? next.inviteCards - 1 : next.inviteCards,
      minuteCards: useInvite ? next.minuteCards : Math.max(0, next.minuteCards - 1),
    };
    if (luckyIndex === 0) next = { ...next, inviteCards: next.inviteCards + 2 };
    if (luckyIndex === 1) next = { ...next, minuteCards: next.minuteCards + 3 };
    if (luckyIndex === 2) next = { ...next, decor: next.decor + 2, fame: next.fame + 2 };
    if (luckyIndex === 3) {
      const target = personnelCards().find((person) => (next.personnel[person.id] || 0) > 0) || personnelCards()[0];
      next = {
        ...next,
        personnel: {
          ...next.personnel,
          [target.id]: Math.min(target.maxLevel, (next.personnel[target.id] || 0) + 1),
        },
      };
      return pushLog(next, `Vòng quay lộc sử bồi dưỡng ${target.name} thêm 1 cấp.`);
    }
    return pushLog(next, 'Vòng quay lộc sử trả thưởng: vé, thẻ hoặc trang trí đã được cộng vào kho.');
  }

  if (miniGame.id === 'fieldFishing') {
    const reward = Math.round(base * 1.1 + current.people * 4);
    next = {
      ...next,
      money: next.money + reward,
      people: Math.min(100, next.people + 4 + Math.min(2, artists)),
      minuteCards: next.minuteCards + 1,
    };
    return pushLog(next, `Bắt cá trên đồng thành công: nhận ${reward.toLocaleString('vi-VN')}đ và tăng lòng dân.`);
  }

  if (miniGame.id === 'chessCart') {
    next = {
      ...next,
      fame: next.fame + 4 + Math.min(3, talent),
      decor: next.decor + 2,
      money: next.money + Math.round(base * 0.9),
    };
    return pushLog(next, 'Giải cờ xe hội làng: nhận 2 trang trí và danh tiếng tăng mạnh.');
  }

  if (miniGame.id === 'nightChef') {
    next = {
      ...next,
      money: next.money + Math.round(base * 1.8),
      people: Math.min(100, next.people + 3 + artists),
      ventures: { ...next.ventures, nightMarket: next.ventures.nightMarket + 1 },
    };
    return pushLog(next, 'Vua bếp chợ đêm hoàn tất: chợ đêm tăng cấp và thu nhập/phút tốt hơn.');
  }

  if (miniGame.id === 'hoiVatNemCon') {
    next = {
      ...next,
      food: (next.food || 0) + 90 + current.stage * 12,
      skillBooks: (next.skillBooks || 0) + 1,
      warMeter: Math.min(100, (next.warMeter || 0) + 8),
    };
    return pushLog(next, 'Hội Vật / Ném Còn thắng lợi: Quan Võ tăng thể lực, kho thêm Lương Thảo và Sách kỹ năng.');
  }

  if (miniGame.id === 'thiHuong') {
    next = {
      ...next,
      literacy: (next.literacy || 0) + 4,
      goldBoards: (next.goldBoards || 0) + 1,
      inviteCards: next.inviteCards + 1,
    };
    return pushLog(next, 'Trường Thi Hương đỗ bảng: nhận Bảng Vàng, Dân Trí và Vé tiến cử Quan Văn.');
  }

  if (miniGame.id === 'canDoDongDem') {
    const reward = Math.round(base * 1.4 + (current.greatWorks?.grandHarbor || 0) * 240);
    next = {
      ...next,
      money: next.money + reward,
      prestige: (next.prestige || 0) + 2,
      marketShare: Math.min(100, (next.marketShare || 0) + 3),
    };
    return pushLog(next, `Cân Đo Đong Đếm tối ưu khoang thuyền: nhận ${reward.toLocaleString('vi-VN')}đ và Uy Vọng.`);
  }

  if (miniGame.id === 'dapDeLuaNuoc') {
    next = {
      ...next,
      food: (next.food || 0) + 140,
      people: Math.min(100, next.people + 3),
      memoryThreads: (next.memoryThreads || 0) + 1,
    };
    return pushLog(next, 'Đắp đê giữ mùa: nhận Lương Thảo, lòng dân và 1 Ký ức dân tộc.');
  }

  if (miniGame.id === 'renThuanThien') {
    next = {
      ...next,
      weapons: (next.weapons || 0) + 70,
      relicFragments: (next.relicFragments || 0) + 1,
      warMeter: Math.min(100, (next.warMeter || 0) + 10),
    };
    return pushLog(next, 'Rèn kiếm Thuận Thiên thành công: nhận Vũ Khí, mảnh cổ vật và tăng Biến cố.');
  }

  if (miniGame.id === 'coLauTapTran') {
    next = {
      ...next,
      skillBooks: (next.skillBooks || 0) + 1,
      prestige: (next.prestige || 0) + 2,
      warMeter: Math.min(100, (next.warMeter || 0) + 8),
    };
    return pushLog(next, 'Cờ lau tập trận hoàn tất: đội hình tăng Bộ chiến, nhận Sách kỹ năng và Uy Vọng.');
  }

  if (miniGame.id === 'veDongHo') {
    next = {
      ...next,
      literacy: (next.literacy || 0) + 3,
      artistGifts: (next.artistGifts || 0) + 1,
      people: Math.min(100, next.people + 2),
    };
    return pushLog(next, 'Vẽ tranh Đông Hồ: mở ký ức dân gian, tăng Dân Trí và nhận Văn phòng tứ bảo.');
  }

  if (miniGame.id === 'towerDefense') {
    next = {
      ...next,
      weapons: Math.max(0, (next.weapons || 0) - 20),
      prestige: (next.prestige || 0) + 3,
      marketShare: Math.min(100, (next.marketShare || 0) + 4),
      relicFragments: (next.relicFragments || 0) + 1,
    };
    return pushLog(next, 'Giữ thành chống giặc: tiêu 20 Vũ Khí, nhận Uy Vọng, thị phần và mảnh cổ vật.');
  }

  return pushLog(next, `${miniGame.name} đã hoàn tất.`);
}

function recruitOrTrainPersonnel(current, personId) {
  const person = personnelCards().find((item) => item.id === personId);
  if (!person) return current;
  const level = current.personnel[personId] || 0;
  if (level >= person.maxLevel) return pushLog(current, `${person.name} đã đạt cấp tối đa.`);
  if (level === 0 && current.inviteCards >= person.inviteCost) {
    return pushLog(
      {
        ...current,
        inviteCards: current.inviteCards - person.inviteCost,
        fame: current.fame + (person.kind === 'Quan Võ' ? 3 : 2),
        people: Math.min(100, current.people + 1),
        personnel: { ...current.personnel, [personId]: 1 },
      },
      `Chiêu mộ ${person.kind} ${person.name}. ${person.effect}`,
    );
  }
  const cost = Math.round(person.cost * rarityCostMultiplier(person.rarity) * (1 + level * 0.7));
  if (current.money < cost) return pushLog(current, `Chưa đủ tiền bồi dưỡng ${person.name}.`);
  const booksNeeded = Math.max(1, Math.ceil((level + 1) / 2));
  if ((current.skillBooks || 0) < booksNeeded) {
    return pushLog(current, `Thiếu ${booksNeeded} Sách kỹ năng để bồi dưỡng ${person.name}.`);
  }
  const needsBreakthrough = level > 0 && (level + 1) % 3 === 0;
  if (needsBreakthrough && (current.breakthroughStones || 0) <= 0) {
    return pushLog(current, `${person.name} cần Đá đột phá để vượt mốc cấp ${level + 1}.`);
  }
  return pushLog(
    {
      ...current,
      money: current.money - cost,
      skillBooks: (current.skillBooks || 0) - booksNeeded,
      breakthroughStones: needsBreakthrough ? (current.breakthroughStones || 0) - 1 : (current.breakthroughStones || 0),
      fame: current.fame + (person.kind === 'Quan Võ' ? 2 : 1),
      people: Math.min(100, current.people + 1),
      personnel: { ...current.personnel, [personId]: level + 1 },
    },
    `${level === 0 ? 'Chiêu mộ' : 'Bồi dưỡng'} ${person.name} lên cấp ${level + 1}.`,
  );
}

function rarityCostMultiplier(rarity) {
  if (rarity === 'Cực hiếm') return 1.36;
  if (rarity === 'Quý hiếm') return 1.28;
  if (rarity === 'Hiếm') return 1.18;
  if (rarity === 'Trác việt') return 1.12;
  if (rarity === 'Tốt') return 1.06;
  return 1;
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
  const bannerBonus = current.upgrades.banner * 0.08 + artistCharm(current) * 0.02;
  const reaction =
    ratio <= 0.85
      ? { text: 'khách vui vì giá mềm', fame: 1, people: 2 }
      : ratio <= 1.25 + bannerBonus
        ? { text: 'khách hài lòng', fame: 2, people: 1 }
        : ratio <= 1.55 + bannerBonus
          ? { text: 'khách hơi đắn đo', fame: 0, people: -1 }
          : { text: 'khách cau mày vì giá cao', fame: -2, people: -2 };

  let result = pushLog(
    {
      ...current,
      money: current.money + currentProduct.price,
      people: Math.max(0, Math.min(100, current.people + reaction.people)),
      fame: Math.max(0, current.fame + reaction.fame),
      day: automatic ? current.day : current.day + 1,
      customerIndex: automatic ? current.customerIndex : current.customerIndex + 1,
      cashDrops: Math.min(12, (current.cashDrops || 0) + (automatic ? 1 : 2)),
      trash: Math.min(8, (current.trash || 0) + (automatic ? 0 : 1)),
      products,
    },
    `${automatic ? 'Phụ việc' : 'Bạn'} bán ${item.name}: ${reaction.text}.`,
  );

  // Kích hoạt sự kiện lịch sử mỗi 3 ngày
  if (!automatic && result.day % 3 === 0) {
    const event = historicalEvents[Math.floor(Math.random() * historicalEvents.length)];
    result = event.apply(result);
    result = pushLog(result, `⚡ ${event.name}: ${event.effect}`);
    result.__triggeredEvent = event;
  }

  return result;
}

function totalShelfOf(game) {
  return productCatalog.reduce((sum, item) => sum + game.products[item.id].shelf, 0);
}

function totalStockOf(game) {
  return productCatalog.reduce((sum, item) => sum + game.products[item.id].stock, 0);
}

function stockByCategory(game) {
  const groups = productCatalog.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + game.products[item.id].stock;
    return acc;
  }, {});
  return Object.entries(groups).map(([category, stock]) => ({ category, stock }));
}

function personnelCards() {
  return [...personnelCatalog, ...extraTalentCatalog];
}

function cleanStore(current) {
  if ((current.trash || 0) <= 0) return pushLog(current, 'Sàn tiệm đã sạch, chưa có việc cần dọn.');
  const reward = 45 + current.level * 12;
  return pushLog(
    {
      ...current,
      trash: Math.max(0, (current.trash || 0) - 1),
      money: current.money + reward,
      people: Math.min(100, current.people + 1),
    },
    `Dọn tiệm gọn gàng, nhặt được ${reward.toLocaleString('vi-VN')}đ và lòng dân tăng nhẹ.`,
  );
}

function collectCashDrops(current) {
  const drops = current.cashDrops || 0;
  if (drops <= 0) return pushLog(current, 'Chưa có tiền lẻ rơi ra để thu thập.');
  const reward = Math.round(drops * (28 + current.level * 9 + artistCharm(current) * 4));
  return pushLog(
    {
      ...current,
      cashDrops: 0,
      money: current.money + reward,
    },
    `Thu ${drops} cụm tiền rơi, nhận ${reward.toLocaleString('vi-VN')}đ.`,
  );
}

function resolveCustomerIncident(current) {
  const incident = customerIncidents[(current.day + current.customerIndex) % customerIncidents.length];
  const charmBonus = Math.min(2, Math.floor(artistPower(current) / 4));
  const rewardMoney = incident.rewardMoney + Math.round(incomePerMinute(current) * 0.18);
  return pushLog(
    {
      ...current,
      money: current.money + rewardMoney,
      diamonds: (current.diamonds || 0) + incident.rewardDiamonds + charmBonus,
      fame: current.fame + 1 + charmBonus,
      people: Math.min(100, current.people + 2),
      day: current.day + 1,
    },
    `${incident.name}: ${incident.prompt} Nhận ${incident.rewardDiamonds + charmBonus} Kim cương.`,
  );
}

function playArcadeGame(current, arcadeId) {
  const arcade = arcadeCatalog.find((item) => item.id === arcadeId);
  if (!arcade) return current;
  if ((current.eventTickets || 0) <= 0) return pushLog(current, `${arcade.name} cần 1 lượt sự kiện.`);
  const artistBonus = artistPower(current);
  let next = {
    ...current,
    eventTickets: Math.max(0, (current.eventTickets || 0) - 1),
    day: current.day + 1,
  };
  if (arcadeId === 'clawMachine') {
    next = {
      ...next,
      artistGifts: (next.artistGifts || 0) + 2 + Math.min(2, artistBonus),
      diamonds: (next.diamonds || 0) + 1,
    };
  }
  if (arcadeId === 'brickStack') {
    next = {
      ...next,
      skillBooks: (next.skillBooks || 0) + 2,
      fame: next.fame + 2,
    };
  }
  if (arcadeId === 'luckyArcade') {
    const rewardType = (current.day + current.fame + artistBonus) % 3;
    if (rewardType === 0) next = { ...next, minuteCards: next.minuteCards + 2 };
    if (rewardType === 1) next = { ...next, artistGifts: (next.artistGifts || 0) + 3 };
    if (rewardType === 2) next = { ...next, inviteCards: next.inviteCards + 1 };
  }
  return pushLog(next, `${arcade.name} hoàn tất: ${arcade.reward} đã được cộng vào kho.`);
}

function assignTalentToVenture(current, ventureId) {
  const venture = ventureCatalog.find((item) => item.id === ventureId);
  if (!venture) return current;
  const ownedTalents = personnelCards().filter((person) => person.kind === 'Quan Võ' && (current.personnel?.[person.id] || 0) > 0);
  if (!ownedTalents.length) return pushLog(current, 'Cần chiêu mộ ít nhất 1 Quan Võ trước khi bổ nhiệm.');
  const currentIndex = ownedTalents.findIndex((person) => person.id === current.assignments?.[ventureId]);
  const nextTalent = ownedTalents[(currentIndex + 1) % ownedTalents.length];
  return pushLog(
    {
      ...current,
      assignments: { ...(current.assignments || {}), [ventureId]: nextTalent.id },
    },
    `Bổ nhiệm ${nextTalent.name} quản lý ${venture.name}. Nếu đúng chuyên môn, doanh thu sẽ nhân mạnh hơn.`,
  );
}

function interactWithArtist(current, artistId, mode) {
  const artist = artistCatalog.find((item) => item.id === artistId);
  if (!artist) return current;
  const level = current.artistLevels?.[artistId] || 0;
  const affinity = current.artistAffinity?.[artistId] || 0;
  let cost = {};
  let gain = 1;
  let label = 'đàm đạo';

  if (mode === 'gift') {
    if ((current.artistGifts || 0) <= 0) return pushLog(current, `Cần Kỳ trân dị bảo để dâng ${artist.name}.`);
    cost = { artistGifts: (current.artistGifts || 0) - 1 };
    gain = 3;
    label = 'dâng kỳ trân';
  }

  if (mode === 'meet') {
    if ((current.diamonds || 0) < 2) return pushLog(current, `Cần 2 Kim cương để yết kiến ${artist.name}.`);
    cost = { diamonds: (current.diamonds || 0) - 2 };
    gain = 5;
    label = 'yết kiến';
  }

  const nextAffinity = affinity + gain;
  const levelUp = nextAffinity >= (level + 1) * 8;
  return pushLog(
    {
      ...current,
      ...cost,
      artistAffinity: { ...(current.artistAffinity || {}), [artistId]: nextAffinity },
      artistLevels: {
        ...(current.artistLevels || {}),
        [artistId]: levelUp ? level + 1 : level,
      },
      fame: current.fame + (levelUp ? 2 : 1),
      people: Math.min(100, current.people + (mode === 'chat' ? 1 : 0)),
    },
    `${label} với ${artist.name}: tín nhiệm +${gain}${levelUp ? ', Quan Văn tăng uy vọng và buff Văn Võ song toàn mạnh hơn.' : '.'}`,
  );
}

function assignedTalentName(game, ventureId) {
  const talentId = game.assignments?.[ventureId];
  const talent = personnelCards().find((person) => person.id === talentId);
  return talent ? talent.name : 'Trống';
}

function ventureAssignmentMultiplier(game, venture) {
  const talentId = game.assignments?.[venture.id];
  const talent = personnelCards().find((person) => person.id === talentId);
  const level = talent ? game.personnel?.[talent.id] || 0 : 0;
  if (!talent || !level) return 1;
  const stats = talentStats(talent, level, game);
  const specialty = venture.specialty || ventureSpecialty(venture.id);
  const relevant = stats[specialty] || stats.infantry || 0;
  const directMatch = talent.specialty === venture.id ? 0.85 : 0;
  const domainMatch = talent.domain === specialty ? 0.4 : 0;
  const deployedPenalty = game.deployedCommanders?.includes(talent.id) ? -0.55 : 0;
  const eraMatch = talent.era === game.activeEra ? 0.75 : 0;
  return Math.max(0.45, Math.min(3.2, 1 + relevant / 120 + directMatch + domainMatch + eraMatch + deployedPenalty));
}

function ventureSpecialty(ventureId) {
  const map = {
    breakfast: 'agriculture',
    scriptorium: 'craft',
    gameRoom: 'infantry',
    nightMarket: 'naval',
    netCafe: 'craft',
    barber: 'infantry',
    cassetteShop: 'naval',
    wetRiceFarm: 'agriculture',
    academy: 'craft',
    fortress: 'infantry',
  };
  return map[ventureId] || 'infantry';
}

function ventureSpecialtyLabel(venture) {
  const labelMap = {
    agriculture: 'Nông vụ',
    craft: 'Công khí',
    naval: 'Thủy chiến',
    infantry: 'Bộ chiến',
  };
  return labelMap[venture.specialty || ventureSpecialty(venture.id)] || 'Bộ chiến';
}

function talentStats(person, level, game) {
  const fallback = person.kind === 'Quan Võ'
    ? { agriculture: 16, craft: 14, naval: 14, infantry: 18 }
    : { agriculture: 6, craft: 6, naval: 6, infantry: 6 };
  const base = person.stats || fallback;
  const linkBonus = linkedArtistBonus(game, person.id);
  const eraBonus = person.era === game.activeEra ? 0.55 : 0;
  const growth = 1 + level * 0.22 + linkBonus + eraBonus;
  return {
    agriculture: Math.round(base.agriculture * growth),
    craft: Math.round(base.craft * growth),
    naval: Math.round(base.naval * growth),
    infantry: Math.round(base.infantry * growth),
  };
}

function linkedArtistBonus(game, talentId) {
  return artistCatalog.reduce((sum, artist) => {
    if (!artist.linkedTalents.includes(talentId)) return sum;
    const level = game.artistLevels?.[artist.id] || 0;
    const affinity = game.artistAffinity?.[artist.id] || 0;
    return sum + level * 0.05 + Math.floor(affinity / 10) * 0.03;
  }, 0);
}

function formatTalentStats(stats) {
  return `Nông ${stats.agriculture} · Công ${stats.craft} · Thủy ${stats.naval} · Bộ ${stats.infantry}`;
}

function artistPower(game) {
  return artistCatalog.reduce((sum, artist) => {
    const level = game.artistLevels?.[artist.id] || 0;
    const affinity = game.artistAffinity?.[artist.id] || 0;
    return sum + level * 3 + Math.floor(affinity / 4);
  }, 0);
}

function artistChainBoost(game) {
  return 1 + Math.min(0.45, artistPower(game) * 0.012);
}

function artistLinkedNames(artist) {
  return artist.linkedTalents
    .map((id) => personnelCards().find((person) => person.id === id)?.name)
    .filter(Boolean)
    .join(', ');
}

function rarityClass(rarity) {
  if (rarity === 'Cực hiếm' || rarity === 'Quý hiếm') return 'rarity-red';
  if (rarity === 'Hiếm' || rarity === 'Trác việt') return 'rarity-orange';
  if (rarity === 'Tốt' || rarity === 'Xuất sắc') return 'rarity-purple';
  return 'rarity-green';
}

function negotiationPower(game) {
  const talentPower = personnelCards()
    .filter((person) => person.kind === 'Quan Võ')
    .reduce((sum, person) => {
      const level = game.personnel?.[person.id] || 0;
      if (!level) return sum;
      const stats = talentStats(person, level, game);
      return sum + Math.round((stats.naval + stats.infantry + stats.craft * 0.35) / 5);
    }, 0);
  const warBookBoost = (game.scholarPolicies?.warBook || 0) * 10;
  const relicBoost = game.activeRelic === 'thuanThien' ? 18 : game.activeRelic === 'lyStele' ? 8 : 4;
  return Math.round(game.fame * 2 + game.people * 0.7 + (game.marketShare || 0) * 0.8 + talentPower + artistPower(game) * 2 + warBookBoost + relicBoost);
}

function negotiationRequirement(game, chapter) {
  return Math.round(54 + game.stage * 18 + chapter.minFame * 0.5);
}

function currentEra(game) {
  return eraCatalog.find((era) => era.id === game.activeEra) || eraCatalog[1];
}

function eraLabel(eraId) {
  return eraCatalog.find((era) => era.id === eraId)?.name || 'Đa thời kỳ';
}

function currentCrisis(game) {
  return historicalCrises.find((crisis) => crisis.era === game.activeEra) || historicalCrises[0];
}

function travelToEra(current, eraId) {
  const era = eraCatalog.find((item) => item.id === eraId);
  if (!era) return current;
  if (current.stage < era.unlockStage) return pushLog(current, `${era.name} mở ở ải ${era.unlockStage}. Tiến triển phải đi theo dòng thời gian để tôn trọng lịch sử.`);
  if (current.activeEra === eraId) return pushLog(current, `Bạn đang ở ${era.name}.`);
  return pushLog(
    {
      ...current,
      activeEra: eraId,
      year: era.year,
      day: current.day + 1,
      warMeter: Math.min(100, (current.warMeter || 0) + 4),
    },
    `Chạm Cây Đa Làng, mở Trục Thời Gian đến ${era.name}: ${era.mapName}.`,
  );
}

function currentRelic(game) {
  return relicCatalog.find((relic) => relic.id === game.activeRelic) || relicCatalog[2];
}

function chooseTimeRelic(current, relicId) {
  const relic = relicCatalog.find((item) => item.id === relicId);
  if (!relic) return current;
  return pushLog(
    {
      ...current,
      activeRelic: relicId,
      memoryThreads: (current.memoryThreads || 0) + 1,
    },
    `Cổ vật cộng hưởng: ${relic.name}. ${relic.story}`,
  );
}

function eraFitText(game, person) {
  if (!person.era) return 'Môn khách linh hoạt: hiệu suất cơ bản ở mọi thời.';
  if (person.era === game.activeEra) return `Đúng thời ${eraLabel(person.era)}: hiệu suất cơ sở tăng mạnh.`;
  return `Lệch thời ${eraLabel(person.era)}: chỉ nhận hiệu suất cơ bản.`;
}

function harvestPeaceResources(current) {
  const activeEra = currentEra(current);
  const relic = currentRelic(current);
  const ownedCommanders = personnelCards().filter((person) => (current.personnel?.[person.id] || 0) > 0);
  const activeCommanders = ownedCommanders.filter((person) => !current.deployedCommanders?.includes(person.id));
  const statTotals = activeCommanders.reduce(
    (sum, person) => {
      const stats = talentStats(person, current.personnel[person.id], current);
      return {
        agriculture: sum.agriculture + stats.agriculture,
        craft: sum.craft + stats.craft,
        naval: sum.naval + stats.naval,
        infantry: sum.infantry + stats.infantry,
      };
    },
    { agriculture: 0, craft: 0, naval: 0, infantry: 0 },
  );
  const relicFoodBonus = relic.id === 'templeBell' ? 28 : 0;
  const foodGain = Math.round(72 + current.stage * 12 + statTotals.agriculture * 0.55 + (activeEra.id === 'hungAuLac' ? 36 : 0) + relicFoodBonus);
  const weaponGain = Math.round(28 + statTotals.craft * 0.45 + statTotals.infantry * 0.18 + (activeEra.id === 'lyTran' ? 18 : 0));
  const moneyGain = Math.round(incomePerMinute(current) * (activeEra.id === 'nguyen' ? 0.72 : 0.48));
  return pushLog(
    {
      ...current,
      money: current.money + moneyGain,
      food: (current.food || 0) + foodGain,
      weapons: (current.weapons || 0) + weaponGain,
      prestige: (current.prestige || 0) + (activeEra.id === 'hauLe' ? 1 : 0),
      warMeter: Math.min(100, (current.warMeter || 0) + 12),
      day: current.day + 1,
    },
    `Ngụ binh ư nông tại ${activeEra.name}: +${foodGain} Lương Thảo, +${weaponGain} Vũ Khí, +${moneyGain.toLocaleString('vi-VN')}đ.`,
  );
}

function toggleDeployment(current, personId) {
  const person = personnelCards().find((item) => item.id === personId);
  if (!person || (current.personnel?.[personId] || 0) <= 0) return current;
  const deployed = new Set(current.deployedCommanders || []);
  if (deployed.has(personId)) {
    deployed.delete(personId);
    return pushLog({ ...current, deployedCommanders: [...deployed] }, `${person.name} trở về trấn cơ sở sản xuất.`);
  }
  deployed.add(personId);
  return pushLog({ ...current, deployedCommanders: [...deployed] }, `Rút ${person.name} khỏi xưởng để chuẩn bị xuất chinh.`);
}

function deployedCommanderPower(game) {
  return (game.deployedCommanders || []).reduce((sum, personId) => {
    const person = personnelCards().find((item) => item.id === personId);
    const level = game.personnel?.[personId] || 0;
    if (!person || !level) return sum;
    const stats = talentStats(person, level, game);
    return sum + Math.round((stats.naval + stats.infantry + stats.craft * 0.25) / 3);
  }, 0);
}

function resolveHistoricalCrisis(current) {
  const crisis = currentCrisis(current);
  if ((current.warMeter || 0) < 100) {
    return pushLog(current, `Biến cố "${crisis.name}" chưa đầy. Hãy sản xuất thời bình, đi mini-game hoặc thương lộ để tích thanh biến cố.`);
  }
  if (!(current.deployedCommanders || []).length) {
    return pushLog(current, 'Cần rút ít nhất 1 Quan Võ khỏi xưởng trước khi xuất chinh.');
  }
  const strategyDiscount = Math.min(0.45, (current.scholarPolicies?.warBook || 0) * 0.1 + artistPower(current) * 0.004);
  const foodCost = Math.round((110 + current.stage * 28) * (1 - strategyDiscount));
  const weaponCost = Math.round((52 + current.stage * 17) * (1 - strategyDiscount));
  if ((current.food || 0) < foodCost || (current.weapons || 0) < weaponCost) {
    return pushLog(current, `Thiếu quân nhu: cần ${foodCost} Lương Thảo và ${weaponCost} Vũ Khí để xuất chinh.`);
  }
  const power = deployedCommanderPower(current) + (current.prestige || 0) * 2 + (current.scholarPolicies?.warBook || 0) * 14;
  const required = 76 + current.stage * 22;
  if (power < required) {
    return pushLog(current, `Xuất chinh chưa đủ lực: đội hình ${power}, biến cố cần ${required}. Hãy bồi dưỡng Quan Võ hoặc biên soạn Binh Thư.`);
  }
  return pushLog(
    {
      ...current,
      food: current.food - foodCost,
      weapons: current.weapons - weaponCost,
      prestige: (current.prestige || 0) + 4,
      fame: current.fame + 5,
      people: Math.min(100, current.people + 4),
      marketShare: Math.min(100, (current.marketShare || 0) + 6),
      warMeter: 0,
      stage: current.stage + 1,
      deployedCommanders: [],
      scholarPolicies: {
        ...(current.scholarPolicies || {}),
        warBook: Math.max(0, (current.scholarPolicies?.warBook || 0) - 1),
      },
    },
    `Thắng biến cố "${crisis.name}". Tiêu ${foodCost} Lương Thảo, ${weaponCost} Vũ Khí; nhận ${crisis.reward}.`,
  );
}

function enactScholarPolicy(current, policyId) {
  const policies = current.scholarPolicies || initialGame.scholarPolicies;
  if (policyId === 'school') {
    const cost = Math.round(520 * (1 + (policies.school || 0) * 0.55));
    if (current.money < cost || (current.artistGifts || 0) < 1) {
      return pushLog(current, `Mở trường Thầy Đồ cần ${cost.toLocaleString('vi-VN')}đ và 1 Văn phòng tứ bảo.`);
    }
    return pushLog(
      {
        ...current,
        money: current.money - cost,
        artistGifts: current.artistGifts - 1,
        literacy: (current.literacy || 0) + 5,
        prestige: (current.prestige || 0) + 1,
        scholarPolicies: { ...policies, school: (policies.school || 0) + 1 },
      },
      'Mở trường Thầy Đồ: Dân Trí tăng, chi phí xây dựng toàn map giảm.',
    );
  }
  if (policyId === 'exam') {
    const cost = 640 + (policies.exam || 0) * 180;
    if (current.money < cost || (current.literacy || 0) < 10) {
      return pushLog(current, `Mở Khoa Thi cần ${cost.toLocaleString('vi-VN')}đ và Dân Trí 10.`);
    }
    return pushLog(
      {
        ...current,
        money: current.money - cost,
        literacy: (current.literacy || 0) + 3,
        goldBoards: (current.goldBoards || 0) + 1,
        inviteCards: current.inviteCards + 1,
        scholarPolicies: { ...policies, exam: (policies.exam || 0) + 1 },
      },
      'Mở Khoa Thi: nhận Bảng Vàng, Vé tiến cử và tăng nền Dân Trí.',
    );
  }
  if (policyId === 'warBook') {
    if ((current.skillBooks || 0) < 2 || (current.artistGifts || 0) < 1) {
      return pushLog(current, 'Biên soạn Binh Thư cần 2 Sách kỹ năng và 1 Văn phòng tứ bảo.');
    }
    return pushLog(
      {
        ...current,
        skillBooks: current.skillBooks - 2,
        artistGifts: current.artistGifts - 1,
        prestige: (current.prestige || 0) + 1,
        scholarPolicies: { ...policies, warBook: (policies.warBook || 0) + 1 },
      },
      'Biên soạn Binh Thư: Quan Võ được tăng sức chiến đấu và giảm hao Lương Thảo ở biến cố kế tiếp.',
    );
  }
  return current;
}

function constructionDiscount(game) {
  const literacyDiscount = Math.min(0.12, (game.literacy || 0) * 0.002);
  const schoolDiscount = Math.min(0.18, (game.scholarPolicies?.school || 0) * 0.04);
  const academyDiscount = Math.min(0.16, (game.greatWorks?.nationalAcademy || 0) * 0.05);
  return Math.max(0.62, 1 - literacyDiscount - schoolDiscount - academyDiscount);
}

function scaledGreatWorkCost(work, level) {
  const scale = 1 + level * 0.85;
  return Object.fromEntries(Object.entries(work.cost).map(([key, value]) => [key, Math.round(value * scale)]));
}

function formatGreatWorkCost(work, level) {
  const cost = scaledGreatWorkCost(work, level);
  const labels = { money: 'Ngân', food: 'Lương', weapons: 'Vũ khí', prestige: 'Uy Vọng', literacy: 'Dân Trí' };
  return Object.entries(cost).map(([key, value]) => `${labels[key]} ${value.toLocaleString('vi-VN')}`).join(' · ');
}

function canPayGreatWork(game, cost) {
  return Object.entries(cost).every(([key, value]) => (game[key] || 0) >= value);
}

function investInGreatWork(current, workId) {
  const work = greatWorkCatalog.find((item) => item.id === workId);
  if (!work) return current;
  const level = current.greatWorks?.[workId] || 0;
  const cost = scaledGreatWorkCost(work, level);
  if (!canPayGreatWork(current, cost)) return pushLog(current, `${work.name} chưa đủ tài nguyên: ${formatGreatWorkCost(work, level)}.`);
  const next = {
    ...current,
    money: current.money - (cost.money || 0),
    food: (current.food || 0) - (cost.food || 0),
    weapons: (current.weapons || 0) - (cost.weapons || 0),
    prestige: (current.prestige || 0) - (cost.prestige || 0) + 2,
    literacy: (current.literacy || 0) - (cost.literacy || 0),
    fame: current.fame + 4,
    greatWorks: { ...(current.greatWorks || {}), [workId]: level + 1 },
  };
  return pushLog(next, `Đầu tư ${work.name} lên cấp ${level + 1}. ${work.effect}`);
}

function pushLog(game, message) {
  return {
    ...game,
    log: [message, ...game.log].slice(0, 6),
  };
}

export default App;
