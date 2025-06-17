import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useLoading } from "../context/LoadingContext";

const BASE_URL = "http://10.0.2.2:8000";

function getUserColor(userId: number) {
  const colors = [
    "#FF1744", "#F50057", "#D500F9", "#651FFF", "#3D5AFE",
    "#FFEA00", "#FFC400", "#FF9100", "#FF3D00", "#8D6E63",
    "#607D8B", "#9C27B0", "#E91E63", "#FF5722", "#795548"
  ];
  return colors[userId % colors.length];
}

export default function ChatScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Chat">>();
  const { eventId } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const { setLoading } = useLoading();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (id) setMyUserId(parseInt(id));
    };
    loadUserId();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/${eventId}/messages`);
      const sorted = Object.values(res.data).sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sorted);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      await api.post(`/chat/${eventId}/messages`, { content: text });
      setText("");
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  useEffect(() => {
    if (myUserId !== null) {
      fetchMessages();
    }
  }, [myUserId]);

  if (myUserId === null) return null;

  const renderItem = ({ item }: { item: any }) => {
    const isMine = item.user_id === myUserId;
    const userColor = getUserColor(item.user_id);
    const initials = `${item.user.profile.first_name.charAt(0)}${item.user.profile.last_name.charAt(0)}`.toUpperCase();

    return (
      <TouchableOpacity
        activeOpacity={isMine ? 1 : 0.7}
        disabled={isMine}
        onPress={() => !isMine && setSelectedUser(item.user)}
        style={[styles.messageRow, isMine ? styles.rowRight : styles.rowLeft]}
      >
        {!isMine && (
          <View style={[styles.avatarBubble, styles.avatarDarkBackground]}> 
            <Text style={[styles.avatarText, { color: userColor }]}>{initials}</Text>
          </View>
        )}
        <View
          style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}
        >
          {!isMine && (
            <Text style={styles.sender}>
              {item.user.profile.first_name} {item.user.profile.last_name}
            </Text>
          )}
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.messagesContainer,
          { flexGrow: 1, justifyContent: "flex-start" },
        ]}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={!!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedUser(null)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Image
              source={
                selectedUser?.profile?.profile_photo
                  ? {
                      uri: selectedUser.profile.profile_photo.startsWith("http")
                        ? selectedUser.profile.profile_photo
                        : `${BASE_URL}${selectedUser.profile.profile_photo}`,
                    }
                  : require("../assets/default-avatar.png")
              }
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignSelf: "center",
                marginBottom: 12,
              }}
              resizeMode="cover"
              onError={() => console.warn("Failed to load avatar")}
            />
            <Text style={styles.modalTitle}>
              {selectedUser?.profile?.first_name} {selectedUser?.profile?.last_name}
            </Text>
            <Text style={styles.modalRating}>
              ⭐ {selectedUser?.profile?.rating?.toFixed(1) ?? "N/A"} ({selectedUser?.profile?.number_of_ratings ?? 0} ratings)
            </Text>
            <Text>{selectedUser?.profile?.description || "No description."}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messagesContainer: {
    padding: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  avatarBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarDarkBackground: {
    backgroundColor: "#00796B",
  },
  avatarText: {
    fontWeight: "bold",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: "#e0e0e0",
    borderTopRightRadius: 0,
    alignSelf: "flex-end",
  },
  theirBubble: {
    backgroundColor: "#d0f0c0",
    borderTopLeftRadius: 0,
    alignSelf: "flex-start",
  },
  sender: {
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#000",
  },
  timestamp: {
    fontSize: 10,
    color: "#555",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#00796B",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  modalRating: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
    textAlign: "center",
  },
});