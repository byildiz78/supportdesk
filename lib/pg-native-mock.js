// Mock for pg-native
export default {
  Client: function() {
    return {
      connectSync: function() { return null; },
      querySync: function() { return []; },
      end: function() { return null; }
    };
  }
};
