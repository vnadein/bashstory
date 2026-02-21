import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export interface CommandResult {
  output: string[]
  newPrompt?: string
  clear?: boolean
  inputMode?: 'password' | 'submit' | null
  inputPrompt?: string
}

interface SessionData {
  userId: number | null
  username: string | null
  isModerator: boolean
  ip: string
}

// Register command as a process
export function registerProcess(command: string, user: string): number {
  const db = getDb()
  const pid = Math.floor(Math.random() * 30000) + 1000
  const cpu = Math.random() * 5
  const memory = Math.random() * 3
  
  db.prepare(`
    INSERT INTO processes (pid, command, user, cpu, memory, status)
    VALUES (?, ?, ?, ?, ?, 'running')
  `).run(pid, command, user, cpu, memory)
  
  return pid
}

// Remove process after command execution
export function removeProcess(pid: number): void {
  const db = getDb()
  db.prepare(`UPDATE processes SET status = 'completed' WHERE pid = ?`).run(pid)
}

// Clean old completed processes (older than 1 hour)
export function cleanOldProcesses(): void {
  const db = getDb()
  db.prepare(`
    UPDATE processes 
    SET status = 'completed' 
    WHERE status = 'running' AND created_at < datetime('now', '-1 hour')
  `).run()
}

// ---- HELP ----
function cmdHelp(): CommandResult {
  return {
    output: [
      'Доступные команды:',
      '',
      '  help                    -- список команд',
      '  login                   -- авторизация',
      '  register                -- регистрация',
      '  logout / exit           -- выход из аккаунта',
      '  reboot                  -- перезагрузка системы',
      '  whoami                  -- текущий пользователь',
      '  clear                   -- очистить экран',
      '  theme <hex>             -- установить цвет текста (#RRGGBB)',
      '',
      '  ls [-n N] [-l]          -- последние цитаты',
      '  cat <id>                -- показать цитату полностью',
      '  grep <текст>            -- поиск цитат',
      '  tail [-f] [-n N]        -- мониторинг цитат',
      '  top                     -- мониторинг процессов',
      '  fortune                 -- случайная цитата',
      '',
      '  vote + <id>             -- проголосовать за цитату',
      '  vote - <id>             -- проголосовать против',
      '',
      '  submit                  -- отправить цитату на модерацию',
      '  cowsay [id]             -- цитата в виде ASCII-коровы',
      '',
      '  Используйте --help после команды для подробной справки.',
      '  Пример: ls --help',
    ],
  }
}

// ---- WHOAMI ----
function cmdWhoami(session: SessionData): CommandResult {
  if (session.userId) {
    return { output: [`${session.username}${session.isModerator ? ' (модератор)' : ''}`] }
  }
  return { output: ['guest'] }
}

// ---- CLEAR ----
function cmdClear(): CommandResult {
  return { output: [], clear: true }
}

// ---- LOGIN (phase 1) ----
function cmdLoginStart(): CommandResult {
  return {
    output: [],
    inputMode: 'password',
    inputPrompt: 'login: ',
  }
}

// ---- LOGIN (phase 2) ----
function cmdLoginProcess(args: string[]): CommandResult {
  const username = args[0]
  const password = args[1]
  if (!username || !password) {
    return { output: ['login: необходимо указать логин и пароль.'] }
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
    id: number; username: string; password_hash: string; role: string
  } | undefined

  if (!user) {
    return { output: ['login: неверный логин или пароль.'] }
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return { output: ['login: неверный логин или пароль.'] }
  }

  return {
    newPrompt: `${user.username}@bashstory:~$ `,
  }
}

// ---- REGISTER ----
function cmdRegisterProcess(args: string[]): CommandResult {
  const username = args[0]
  const password = args[1]
  const password2 = args[2]

  if (!username || !password || !password2) {
    return { output: ['register: необходимо указать логин и пароль (дважды).'] }
  }
  if (password !== password2) {
    return { output: ['register: пароли не совпадают.'] }
  }
  if (username.length < 3 || username.length > 20) {
    return { output: ['register: логин должен быть от 3 до 20 символов.'] }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { output: ['register: логин может содержать только латинские буквы, цифры и _.'] }
  }
  if (password.length < 4) {
    return { output: ['register: пароль слишком короткий (минимум 4 символа).'] }
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return { output: [`register: пользователь '${username}' уже существует.`] }
  }

  const hash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash)

  return {
    newPrompt: `${username}@bashstory:~$ `,
  }
}

// ---- LS ----
function cmdLs(args: string[]): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: ls [опции]',
        '',
        'Показать последние цитаты.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '  -n <число>     количество цитат (макс. 50)',
        '  -l, --long     длинный формат вывода',
        '  -a, --all      показать все цитаты (до 100)',
        '',
        'Примеры:',
        '  ls             -- последние 10 цитат',
        '  ls -n 20       -- последние 20 цитат',
        '  ls -l          -- длинный формат',
      ],
    }
  }
  
  let count = 10
  let longFormat = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) {
      count = Math.min(parseInt(args[i + 1], 10) || 10, 50)
      i++
    }
    if (args[i] === '-l' || args[i] === '--long') longFormat = true
    if (args[i] === '-a' || args[i] === '--all') count = 100
  }

  const db = getDb()
  const quotes = db.prepare(`
    SELECT q.*, u.username as author_name,
      COALESCE((SELECT SUM(value) FROM votes WHERE quote_id = q.id), 0) as rating
    FROM quotes q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.status = 'approved'
    ORDER BY q.created_at DESC
    LIMIT ?
  `).all(count) as Array<{
    id: number; text: string; author_name: string | null; rating: number; created_at: string
  }>

  if (quotes.length === 0) {
    return { output: ['Цитат пока нет.'] }
  }

  const lines: string[] = []
  for (const q of quotes) {
    const date = q.created_at.split('T')[0] || q.created_at.split(' ')[0]
    const author = q.author_name || 'Аноним'
    const ratingStr = q.rating >= 0 ? `+${q.rating}` : `${q.rating}`
    const maxLen = longFormat ? 80 : 50
    const preview = q.text.replace(/\n/g, ' ').substring(0, maxLen)
    const ellipsis = q.text.length > maxLen ? '...' : ''
    lines.push(`  #${q.id} (${ratingStr}) "${preview}${ellipsis}" -- ${author}, ${date}`)
  }

  return { output: lines }
}

// ---- CAT ----
function cmdCat(args: string[]): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: cat <id>',
        '',
        'Показать цитату полностью по ID.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Примеры:',
        '  cat 1          -- показать цитату #1',
        '  cat 42         -- показать цитату #42',
      ],
    }
  }
  
  const id = parseInt(args[0], 10)
  if (!id) return { output: ['cat: укажите ID цитаты.'] }

  const db = getDb()
  const quote = db.prepare(`
    SELECT q.*, u.username as author_name,
      COALESCE((SELECT SUM(value) FROM votes WHERE quote_id = q.id), 0) as rating
    FROM quotes q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.id = ? AND q.status = 'approved'
  `).get(id) as {
    id: number; text: string; author_name: string | null; rating: number; created_at: string
  } | undefined

  if (!quote) {
    return { output: [`cat: цитата #${id} не найдена.`] }
  }

  const date = quote.created_at.split('T')[0] || quote.created_at.split(' ')[0]
  const author = quote.author_name || 'Аноним'
  const ratingStr = quote.rating >= 0 ? `+${quote.rating}` : `${quote.rating}`

  return {
    output: [
      `--- Цитата #${quote.id} [рейтинг: ${ratingStr}] (${author}, ${date}) ---`,
      '',
      ...quote.text.split('\n'),
      '',
      '---',
    ],
  }
}

// ---- GREP ----
function cmdGrep(args: string[]): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: grep [опции] <текст>',
        '',
        'Поиск цитат по содержащемуся тексту.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Примеры:',
        '  grep программирование    -- поиск по слову "программирование"',
        '  grep "hello world"       -- поиск по фразе',
      ],
    }
  }
  
  const searchText = args.join(' ')
  if (!searchText) return { output: ['grep: укажите текст для поиска.'] }

  const db = getDb()
  const quotes = db.prepare(`
    SELECT q.id, q.text,
      COALESCE((SELECT SUM(value) FROM votes WHERE quote_id = q.id), 0) as rating
    FROM quotes q
    WHERE q.status = 'approved' AND q.text LIKE ?
    LIMIT 20
  `).all(`%${searchText}%`) as Array<{ id: number; text: string; rating: number }>

  if (quotes.length === 0) {
    return { output: [`grep: ничего не найдено по запросу '${searchText}'.`] }
  }

  const lines: string[] = [`Найдено: ${quotes.length}`]
  for (const q of quotes) {
    const preview = q.text.replace(/\n/g, ' ').substring(0, 60)
    const ratingStr = q.rating >= 0 ? `+${q.rating}` : `${q.rating}`
    lines.push(`  #${q.id} (${ratingStr}) "${preview}${q.text.length > 60 ? '...' : ''}"`)
  }

  return { output: lines }
}

// ---- VOTE ----
function cmdVote(args: string[], session: SessionData): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: vote <+|-> <id>',
        '',
        'Проголосовать за цитату.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Примеры:',
        '  vote + 1       -- проголосовать за цитату #1',
        '  vote - 5       -- проголосовать против цитаты #5',
      ],
    }
  }
  
  if (args.length < 2) {
    return { output: ['Использование: vote + <id> или vote - <id>'] }
  }

  const direction = args[0]
  const id = parseInt(args[1], 10)

  if (direction !== '+' && direction !== '-') {
    return { output: ['vote: укажите + или - перед ID.'] }
  }
  if (!id) {
    return { output: ['vote: укажите корректный ID цитаты.'] }
  }

  const db = getDb()
  const quote = db.prepare("SELECT id FROM quotes WHERE id = ? AND status = 'approved'").get(id) as { id: number } | undefined
  if (!quote) {
    return { output: [`vote: цитата #${id} не найдена.`] }
  }

  const value = direction === '+' ? 1 : -1

  if (session.userId) {
    const existing = db.prepare('SELECT id FROM votes WHERE quote_id = ? AND user_id = ?').get(id, session.userId)
    if (existing) {
      return { output: ['Вы уже голосовали за эту цитату.'] }
    }
    db.prepare('INSERT INTO votes (quote_id, user_id, value) VALUES (?, ?, ?)').run(id, session.userId, value)
  } else {
    return { output: ['Для голосования необходимо авторизоваться. Используйте login или register.'] }
  }

  const result = db.prepare('SELECT COALESCE(SUM(value), 0) as rating FROM votes WHERE quote_id = ?').get(id) as { rating: number }
  return {
    output: [`Голос учтён. Текущий рейтинг цитаты #${id}: ${result.rating >= 0 ? '+' : ''}${result.rating}`],
  }
}

// ---- FORTUNE ----
function cmdFortune(args: string[]): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: fortune',
        '',
        'Показать случайную цитату.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
      ],
    }
  }
  
  const db = getDb()
  const countResult = db.prepare("SELECT COUNT(*) as cnt FROM quotes WHERE status = 'approved'").get() as { cnt: number }
  if (countResult.cnt === 0) return { output: ['Цитат пока нет.'] }

  const offset = Math.floor(Math.random() * countResult.cnt)
  const q = db.prepare(`
    SELECT q.*, u.username as author_name,
      COALESCE((SELECT SUM(value) FROM votes WHERE quote_id = q.id), 0) as rating
    FROM quotes q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.status = 'approved'
    LIMIT 1 OFFSET ?
  `).get(offset) as {
    id: number; text: string; author_name: string | null; rating: number
  } | undefined

  if (!q) return { output: ['Цитат пока нет.'] }

  const author = q.author_name || 'Аноним'
  const ratingStr = q.rating >= 0 ? `+${q.rating}` : `${q.rating}`

  return {
    output: [
      `--- Цитата #${q.id} [рейтинг: ${ratingStr}] (${author}) ---`,
      '',
      ...q.text.split('\n'),
      '',
      '---',
    ],
  }
}

// ---- COWSAY ----
function cmdCowsay(args: string[]): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: cowsay [id]',
        '',
        'Показать цитату в виде ASCII-коровы.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Примеры:',
        '  cowsay         -- случайная цитата',
        '  cowsay 5       -- цитата #5 в виде коровы',
      ],
    }
  }
  
  let text = ''
  const id = parseInt(args[0], 10)

  const db = getDb()

  if (id) {
    const quote = db.prepare("SELECT text FROM quotes WHERE id = ? AND status = 'approved'").get(id) as { text: string } | undefined
    if (!quote) return { output: [`cowsay: цитата #${id} не найдена.`] }
    text = quote.text.replace(/\n/g, ' ')
  } else {
    const countResult = db.prepare("SELECT COUNT(*) as cnt FROM quotes WHERE status = 'approved'").get() as { cnt: number }
    if (countResult.cnt === 0) return { output: ['Цитат пока нет.'] }
    const offset = Math.floor(Math.random() * countResult.cnt)
    const q = db.prepare("SELECT text FROM quotes WHERE status = 'approved' LIMIT 1 OFFSET ?").get(offset) as { text: string } | undefined
    text = q?.text.replace(/\n/g, ' ') || 'Мууу!'
  }

  const maxWidth = 40
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxWidth) {
      if (current) lines.push(current)
      current = word
    } else {
      current = current ? current + ' ' + word : word
    }
  }
  if (current) lines.push(current)

  const longestLine = Math.max(...lines.map((l) => l.length))
  const border = '-'.repeat(longestLine + 2)
  const paddedLines = lines.map((l) => `| ${l.padEnd(longestLine)} |`)

  return {
    output: [
      ` ${border}`,
      ...paddedLines,
      ` ${border}`,
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ],
  }
}

// ---- TAIL ----
function cmdTail(args: string[], meta?: { phase?: string; args?: string[] }): CommandResult {
  // Handle auto-update phase for tail -f
  if (meta?.phase === 'update') {
    // Use meta.args instead of args for update phase
    const updateArgs = meta.args || args
    let count = 10
    for (let i = 0; i < (updateArgs || []).length; i++) {
      if (updateArgs[i] === '-n' && updateArgs[i + 1]) {
        count = Math.min(parseInt(updateArgs[i + 1], 10) || 10, 50)
        i++
      }
    }
    
    const db = getDb()
    // Get latest quotes in DESC order (newest first by ID)
    const quotes = db.prepare(`
      SELECT q.*, u.username as author_name,
        COALESCE((SELECT SUM(value) FROM votes WHERE quote_id = q.id), 0) as rating
      FROM quotes q
      LEFT JOIN users u ON q.author_id = u.id
      WHERE q.status = 'approved'
      ORDER BY q.id DESC
      LIMIT ?
    `).all(count) as Array<{
      id: number; text: string; author_name: string | null; rating: number; created_at: string
    }>
    
    if (quotes.length === 0) {
      return { output: ['Цитат пока нет.'] }
    }
    
    // Show newest first (DESC order, no reverse)
    const lines: string[] = []
    for (const q of quotes) {
      const date = q.created_at.split('T')[0] || q.created_at.split(' ')[0]
      const author = q.author_name || 'Аноним'
      const ratingStr = q.rating >= 0 ? `+${q.rating}` : `${q.rating}`
      // Full text with line breaks preserved
      lines.push(`[#${q.id}] (${ratingStr}) ${author}, ${date}:`)
      for (const line of q.text.split('\n')) {
        lines.push(`  ${line}`)
      }
    }
    
    return { output: lines }
  }
  
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: tail [-f] [-n <число>]',
        '',
        'Показать последние цитаты. С опцией -f следить за новыми.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '  -f, --follow   режим реального времени (Ctrl+C для выхода)',
        '  -n <число>     количество цитат (по умолчанию 10)',
        '',
        'Примеры:',
        '  tail           -- последние 10 цитат',
        '  tail -n 20     -- последние 20 цитат',
        '  tail -f        -- следить за новыми цитатами',
        '  tail -f -n 5   -- следить, показывая 5 цитат',
      ],
    }
  }
  
  let count = 10
  let follow = false
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) {
      count = Math.min(parseInt(args[i + 1], 10) || 10, 50)
      i++
    }
    if (args[i] === '-f' || args[i] === '--follow') follow = true
  }
  
  const db = getDb()
  const quotes = db.prepare(`
    SELECT q.*, u.username as author_name,
      COALESCE((SELECT SUM(value) FROM votes WHERE quote_id = q.id), 0) as rating
    FROM quotes q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.status = 'approved'
    ORDER BY q.id DESC
    LIMIT ?
  `).all(count) as Array<{
    id: number; text: string; author_name: string | null; rating: number; created_at: string
  }>

  if (quotes.length === 0) {
    return { output: ['Цитат пока нет.'] }
  }

  const lines: string[] = []
  for (const q of quotes) {
    const date = q.created_at.split('T')[0] || q.created_at.split(' ')[0]
    const author = q.author_name || 'Аноним'
    const ratingStr = q.rating >= 0 ? `+${q.rating}` : `${q.rating}`
    // Full text with line breaks preserved
    lines.push(`[#${q.id}] (${ratingStr}) ${author}, ${date}:`)
    for (const line of q.text.split('\n')) {
      lines.push(`  ${line}`)
    }
  }
  
  if (follow) {
    return {
      output: lines,
      inputMode: 'tail-follow',
      inputPrompt: '',
    }
  }
  
  return { output: lines }
}

// ---- SUBMIT (start) ----
function cmdSubmitStart(session: SessionData): CommandResult {
  if (!session.userId) {
    return {
      output: ['Для отправки цитат необходимо авторизоваться.', 'Используйте login или register.'],
    }
  }
  return {
    output: ['Введите текст цитаты. Для завершения введите .done на отдельной строке:'],
    inputMode: 'submit',
    inputPrompt: '> ',
  }
}

// ---- SUBMIT (process) ----
function cmdSubmitProcess(text: string, session: SessionData): CommandResult {
  if (!session.userId) {
    return { output: ['submit: необходима авторизация.'] }
  }
  const trimmed = text.trim()
  if (trimmed.length < 10) {
    return { output: ['submit: цитата слишком короткая (минимум 10 символов).'] }
  }
  if (trimmed.length > 1000) {
    return { output: ['submit: цитата слишком длинная (максимум 1000 символов).'] }
  }

  const db = getDb()
  const result = db.prepare('INSERT INTO quotes (text, author_id, status) VALUES (?, ?, ?)').run(trimmed, session.userId, 'pending')

  return {
    output: [`Цитата отправлена на модерацию (ID: #${result.lastInsertRowid}).`],
  }
}

// ---- QUEUE (moderator) ----
function cmdQueue(session: SessionData): CommandResult {
  if (!session.isModerator) {
    return { output: ['queue: недостаточно прав. Только для модераторов.'] }
  }

  const db = getDb()
  const quotes = db.prepare(`
    SELECT q.*, u.username as author_name
    FROM quotes q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.status = 'pending'
    ORDER BY q.created_at ASC
  `).all() as Array<{ id: number; text: string; author_name: string | null }>

  if (quotes.length === 0) {
    return { output: ['Очередь модерации пуста.'] }
  }

  const lines: string[] = [`Очередь модерации (${quotes.length}):`, '']
  for (const q of quotes) {
    const preview = q.text.replace(/\n/g, ' ').substring(0, 60)
    const author = q.author_name || 'Аноним'
    lines.push(`  #${q.id}: "${preview}${q.text.length > 60 ? '...' : ''}" (от ${author})`)
  }

  return { output: lines }
}

// ---- PUBLISH (moderator) ----
function cmdPublish(args: string[], session: SessionData): CommandResult {
  if (!session.isModerator) {
    return { output: ['publish: недостаточно прав. Только для модераторов.'] }
  }

  const raw = args[0] || ''
  const id = parseInt(raw, 10)
  if (!id) return { output: ['publish: укажите ID цитаты.'] }

  const db = getDb()
  const quote = db.prepare("SELECT id FROM quotes WHERE id = ? AND status = 'pending'").get(id) as { id: number } | undefined
  if (!quote) {
    return { output: [`publish: цитата #${id} не найдена в очереди.`] }
  }

  db.prepare("UPDATE quotes SET status = 'approved' WHERE id = ?").run(id)

  return { output: [`Цитата #${id} опубликована.`] }
}

// ---- REJECT (moderator) ----
function cmdReject(args: string[], session: SessionData): CommandResult {
  if (!session.isModerator) {
    return { output: ['reject: недостаточно прав. Только для модераторов.'] }
  }

  const raw = args[0] || ''
  const id = parseInt(raw, 10)
  if (!id) return { output: ['reject: укажите ID цитаты.'] }

  const db = getDb()
  const quote = db.prepare("SELECT id FROM quotes WHERE id = ? AND status = 'pending'").get(id) as { id: number } | undefined
  if (!quote) {
    return { output: [`reject: цитата #${id} не найдена в очереди.`] }
  }

  db.prepare("UPDATE quotes SET status = 'rejected' WHERE id = ?").run(id)

  return { output: [`Цитата #${id} отклонена.`] }
}

// ---- THEME ----
function cmdTheme(args: string[]): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: theme <hex-цвет>',
        '',
        'Установить цвет текста терминала.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Примеры:',
        '  theme #4AFB7F  -- зелёный цвет (по умолчанию)',
        '  theme #FF5733  -- оранжевый цвет',
        '  theme #00FFFF  -- голубой цвет',
      ],
    }
  }
  
  const color = args[0]

  if (!color) {
    return { output: ['Использование: theme <hex-цвет>', 'Пример: theme #4AFB7F'] }
  }

  // Validate hex color
  const hexRegex = /^#[0-9A-Fa-f]{6}$/
  if (!hexRegex.test(color)) {
    return { output: [`theme: '${color}' не является корректным HEX-цветом. Используйте формат #RRGGBB.`] }
  }

  return {
    output: [`Тема установлена: ${color}`],
    newPrompt: color,
  }
}

// ---- REBOOT ----
function cmdReboot(session: SessionData): CommandResult {
  const user = session.username || 'guest'
  return {
    output: [
      `Broadcast message from ${user}@bashstory:`,
      '  The system is going down for reboot NOW!',
    ],
    clear: true,
  }
}

// ---- TOP ----
async function cmdTopProcesses(args: string[]): Promise<CommandResult> {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: top',
        '',
        'Мониторинг процессов в реальном времени.',
        'Показывает загрузку сервера и активные команды пользователей.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Управление:',
        '  q              выйти из режима top',
      ],
    }
  }
  
  const db = getDb()

  // Get real system load
  let loadAvg = '0.00, 0.00, 0.00'
  let totalProcs = 0
  
  try {
    const { stdout } = await execPromise('uptime')
    const loadMatch = stdout.match(/load average: ([\d.]+), ([\d.]+), ([\d.]+)/)
    if (loadMatch) {
      loadAvg = `${loadMatch[1]}, ${loadMatch[2]}, ${loadMatch[3]}`
    }
  } catch {
    loadAvg = 'N/A'
  }
  
  try {
    const { stdout } = await execPromise('ps aux | wc -l')
    totalProcs = parseInt(stdout.trim(), 10) || 0
  } catch {
    totalProcs = 0
  }
  
  // Get user-submitted commands as "processes"
  const processes = db.prepare(`
    SELECT pid, command, user, cpu, memory, status, created_at
    FROM processes
    WHERE status = 'running'
    ORDER BY cpu DESC
    LIMIT 15
  `).all() as Array<{
    pid: number; command: string; user: string; cpu: number; memory: number; status: string; created_at: string
  }>
  
  // Generate fake system processes
  const systemProcs = [
    { pid: 1, command: 'init', user: 'root', cpu: 0.1, memory: 0.5 },
    { pid: 2, command: 'kthreadd', user: 'root', cpu: 0.0, memory: 0.0 },
    { pid: 45, command: 'bashstory-server', user: 'www-data', cpu: 2.3, memory: 4.2 },
    { pid: 128, command: 'node --next-dev', user: 'www-data', cpu: 5.1, memory: 8.7 },
  ]
  
  const allProcs = [...systemProcs, ...processes.map(p => ({
    pid: p.pid,
    command: p.command,
    user: p.user,
    cpu: p.cpu,
    memory: p.memory,
  }))]
  
  // Sort by CPU and take top 15
  allProcs.sort((a, b) => b.cpu - a.cpu)
  const topProcs = allProcs.slice(0, 15)
  
  const lines = [
    `top - ${new Date().toLocaleTimeString('ru-RU')} up 1 day,  2:34,  1 user,  load average: ${loadAvg}`,
    `Tasks: ${topProcs.length} total,   ${topProcs.filter(p => p.cpu > 0).length} running,   0 sleeping,   0 stopped,   0 zombie`,
    `%Cpu(s):  ${topProcs.reduce((sum, p) => sum + p.cpu, 0).toFixed(1)} us,  1.2 sy,  0.0 ni,  ${Math.max(0, 100 - topProcs.reduce((sum, p) => sum + p.cpu, 0)).toFixed(1)} id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st`,
    'MiB Mem :   8192.0 total,   2048.0 free,   1536.0 used,   4608.0 buff/cache',
    'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   6144.0 avail Mem',
    '',
    `  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND`,
  ]
  
  for (const proc of topProcs) {
    const virt = (proc.memory * 100 + Math.random() * 50000).toFixed(0)
    const res = (proc.memory * 50 + Math.random() * 10000).toFixed(0)
    const shr = (Math.random() * 5000).toFixed(0)
    const time = `${(Math.random() * 10).toFixed(1)}:00`
    lines.push(`  ${proc.pid.toString().padStart(5)} ${proc.user.padEnd(9)}  ${proc.cpu.toFixed(1).padStart(4)}   0  ${virt.padStart(7)} ${res.padStart(7)} ${shr.padStart(7)} R   ${proc.cpu.toFixed(1).padStart(4)}   ${proc.memory.toFixed(1)}   ${time.padStart(7)} ${proc.command}`)
  }
  
  return { output: lines }
}

// ---- MAIN DISPATCHER ----
export async function executeCommand(
  rawCommand: string,
  session: SessionData,
  meta?: { phase?: string; args?: string[]; submitText?: string }
): Promise<CommandResult> {
  // Handle multi-step commands
  if (meta?.phase === 'login') {
    return cmdLoginProcess(meta.args || [])
  }
  if (meta?.phase === 'register') {
    return cmdRegisterProcess(meta.args || [])
  }
  if (meta?.phase === 'submit') {
    return cmdSubmitProcess(meta.submitText || '', session)
  }

  const trimmed = rawCommand.trim()
  if (!trimmed) return { output: [] }

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  switch (cmd) {
    case 'help':
      return cmdHelp()
    case 'whoami':
      return cmdWhoami(session)
    case 'clear':
      return cmdClear()
    case 'login':
      return cmdLoginStart()
    case 'register':
      return { output: [], inputMode: 'password', inputPrompt: 'login: ' }
    case 'logout':
    case 'exit':
      if (!session.userId) {
        return { output: ['Вы не авторизованы.'] }
      }
      return { output: ['До свидания!'], newPrompt: 'guest@bashstory:~$ ' }
    case 'ls':
    case 'dir':
      return cmdLs(args)
    case 'cat':
      return cmdCat(args)
    case 'grep':
      return cmdGrep(args)
    case 'vote':
      return cmdVote(args, session)
    case 'top':
      return await cmdTopProcesses(args)
    case 'tail':
      return cmdTail(args, meta)
    case 'fortune':
      return cmdFortune(args)
    case 'cowsay':
      return cmdCowsay(args)
    case 'submit':
    case 'nano':
      return cmdSubmitStart(session)
    case 'queue':
      return cmdQueue(session)
    case 'publish':
      return cmdPublish(args, session)
    case 'reject':
      return cmdReject(args, session)
    case 'theme':
      return cmdTheme(args)
    case 'reboot':
      return cmdReboot(session)
    default:
      return { output: [`bash: команда не найдена: ${cmd}. Введите help для списка команд.`] }
  }
}
