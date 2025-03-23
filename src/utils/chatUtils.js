export const getPrivateChatId = (user1Id, user2Id) => {
  return [user1Id, user2Id].sort().join(':');
};

export const getPermanentChatId = (username1, username2) => {
  return ['permanent', username1, username2].sort().slice(1).join(':');
}; 