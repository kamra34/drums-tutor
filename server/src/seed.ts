import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Check if built-in exercises already exist
  const existing = await prisma.exercise.count({ where: { isBuiltin: true } })
  if (existing > 0) {
    console.log(`Found ${existing} built-in exercises, skipping seed.`)
    return
  }

  // Seed built-in exercises (a few examples — the full library is in the frontend)
  await prisma.exercise.createMany({
    data: [
      {
        title: 'Basic Rock Beat',
        description: 'HH eighths, snare 2+4, kick 1+3. The #1 beat in music.',
        patternData: {
          beats: 4, subdivisions: 4,
          tracks: {
            hihat_closed: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
            snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
            kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
          },
        },
        category: 'rock', difficulty: 3, bpm: 100,
        timeSignature: [4, 4], bars: 4, tags: ['rock', 'essential'], isBuiltin: true,
      },
      {
        title: 'Quarter Notes on Snare',
        description: 'Play snare on every beat. The foundation of all rhythm.',
        patternData: {
          beats: 4, subdivisions: 4,
          tracks: { snare: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] },
        },
        category: 'reading', difficulty: 1, bpm: 80,
        timeSignature: [4, 4], bars: 4, tags: ['quarter-notes', 'beginner'], isBuiltin: true,
      },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
