/* =========================================================
   COMMENT SERVICE — comments, likes, one-level replies
   User-added comments persist in Store key "comments".
========================================================= */
function _allComments(postId) {
  return [...MOCK.comments, ...Store.get('comments', [])].filter(c => c.postId === postId);
}
function countComments(postId) { return _allComments(postId).length; }

function _decorateComment(c, likes) {
  const liked = likes.comments.includes(c.id);
  return { ...c, author: getAuthor(c.authorId) || { id: c.authorId, name: 'Former member', branch: '' }, liked, likeCount: (c.likes || 0) + (liked ? 1 : 0) };
}
/** Top-level comments (oldest first), each with a `replies` array */
function getComments(postId) {
  const likes = _likeState();
  const all = _allComments(postId).map(c => _decorateComment(c, likes)).sort((a, b) => a.createdAt - b.createdAt);
  return all.filter(c => !c.parentCommentId).map(c => ({ ...c, replies: all.filter(r => r.parentCommentId === c.id) }));
}
/** Replies to a reply are attached to the top-level comment (max one level of nesting) */
function addComment(postId, content, parentCommentId = null) {
  const text = content.trim();
  if (!text) throw new Error('EMPTY_COMMENT');
  const list = Store.get('comments', []);
  if (parentCommentId) {
    const parent = _allComments(postId).find(c => c.id === parentCommentId);
    if (!parent) throw new Error('PARENT_NOT_FOUND');
    parentCommentId = parent.parentCommentId || parent.id;
  }
  const c = { id: 'uc' + Date.now() + Math.floor(Math.random() * 1000), postId, authorId: MOCK.currentUserId, content: text, createdAt: Date.now(), likes: 0, parentCommentId };
  list.push(c);
  if (!Store.set('comments', list)) throw new Error('STORAGE_FULL');
  return _decorateComment(c, _likeState());
}
function likeComment(id) { const l = _likeState(); if (!l.comments.includes(id)) l.comments.push(id); Store.set('likes', l); }
function unlikeComment(id) { const l = _likeState(); l.comments = l.comments.filter(x => x !== id); Store.set('likes', l); }
