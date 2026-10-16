import assert from 'node:assert/strict'
import { test } from 'node:test'
import { load } from './helpers/load-ts.mjs'

const jsx = (type, props) => ({ type, props })
const runtime = { jsx, jsxs: jsx, Fragment: 'fragment' }

test('below-fold photo grids stay lazy; an explicitly visible gallery prioritizes only its first image', () => {
  const { default: Grid } = load('src/components/ui/PhotoGrid.tsx', {
    'react/jsx-runtime': runtime, 'next/image': 'image', 'react-icons/fi': { FiMaximize2: 'icon' }, './PhotoGrid.module.css': {},
  })
  const photos = [{ src: '/one.webp', alt: 'Unu' }, { src: '/two.webp', alt: 'Doi' }]
  let selected
  for (const prioritizeFirst of [false, true]) {
    const buttons = Grid({ photos, prioritizeFirst, onSelect: (photo, index) => { selected = { photo, index } } }).props.children
    buttons.forEach((button, index) => {
      const image = button.props.children[0]
      assert.equal(image.props.loading, prioritizeFirst && index === 0 ? 'eager' : 'lazy')
      assert.equal(image.props.fetchPriority, prioritizeFirst && index === 0 ? 'high' : 'auto')
    })
    buttons[1].props.onClick()
    assert.equal(selected.photo, photos[1])
    assert.equal(selected.index, 1)
  }
})

test('server story composition preserves edited and cleared copy before passing only the selected story to the client', () => {
  const { default: Story } = load('src/components/project-stories/components/StoryDesign.tsx', {
    'react/jsx-runtime': runtime,
    '@/lib/project-story-copy': { editableStoryKeys: { mimesiss: ['first', 'second'] } },
    '@/lib/project-story-defaults': { mimesissChapters: [{ label: 'Conferințe', title: 'Original', body: 'Original' }, { label: 'Participanți', title: '', body: 'Participanți' }] },
    'next/image': 'image', './InlineAlbum': 'album', './MimesissScrollStory': 'neural', './EventScrollStory': 'event',
    '../lib/event-stories': { getEventStory: (project, tentCopy, storyCopy) => ({ id: project.id, tentCopy, storyCopy }) },
    './StoryDesign.module.css': {},
  })
  const project = { id: 'mimesiss', kicker: 'Congres', description: [], title: 'MIMESISS' }
  const edited = Story({ project, storyCopy: { first: { title: 'Editat', body: '' } } }).props.children[0]
  assert.equal(edited.type, 'neural')
  assert.equal(edited.props.kicker, 'Congres')
  assert.equal(edited.props.chapters[0].title, 'Editat')
  assert.equal(edited.props.chapters[0].body, '')
  assert.equal(edited.props.chapters[1].body, 'Participanți')
  assert.equal('project' in edited.props, false)
  const tentCopy = { first: { title: 'Cort', body: 'Text' } }
  const tent = Story({ project: { ...project, id: 'cort' }, tentCopy }).props.children[0]
  assert.equal(tent.type, 'event')
  assert.equal(tent.props.story.id, 'cort')
  assert.equal(tent.props.story.tentCopy, tentCopy)
})
