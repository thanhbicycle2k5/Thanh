import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextTrackId } from './musicPlayer';

const tracks = [
  { id: 'a', name: 'A', url: 'a.mp3' },
  { id: 'b', name: 'B', url: 'b.mp3' },
  { id: 'c', name: 'C', url: 'c.mp3' },
];

test('loop_one keeps the current track', () => {
  assert.equal(getNextTrackId({ tracks, currentTrackId: 'b', playbackMode: 'loop_one', currentIndex: 1 }), 'b');
});

test('loop_all wraps to the first track at the end', () => {
  assert.equal(getNextTrackId({ tracks, currentTrackId: 'c', playbackMode: 'loop_all', currentIndex: 2 }), 'a');
});

test('shuffle picks a different track', () => {
  const nextId = getNextTrackId({ tracks, currentTrackId: 'b', playbackMode: 'shuffle', currentIndex: 1, random: () => 0 });
  assert.equal(nextId, 'a');
});

test('play_once can advance manually to the next track', () => {
  assert.equal(getNextTrackId({ tracks, currentTrackId: 'a', playbackMode: 'play_once', currentIndex: 0 }), 'b');
});
