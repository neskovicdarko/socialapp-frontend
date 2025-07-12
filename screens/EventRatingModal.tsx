import React, { useState } from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import api from "../api";
import { Event, User } from "../models/Event";

interface Props {
  event: Event;
  visible: boolean;
  onClose: () => void;
  onFinish: () => void;
  currentUserId: number;
}

export default function EventRatingModal({
  event,
  visible,
  onClose,
  onFinish,
  currentUserId,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [eventRating, setEventRating] = useState<number>(0);
  const [eventComment, setEventComment] = useState("");
  const [participantRatings, setParticipantRatings] = useState<
    { user: User; score: number; comment: string }[]
  >(
    (event.users ?? [])
      .filter((u) => u.id !== event.owner_id && u.id !== currentUserId)
      .map((u) => ({ user: u, score: 0, comment: "" }))
  );
  const [skipParticipants, setSkipParticipants] = useState(false);
  const [ownerRating, setOwnerRating] = useState<number>(0);
  const [ownerComment, setOwnerComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitAll = async () => {
    setSubmitting(true);
    try {
      await api.post(`/events/${event.id}/rate`, {
        score: eventRating,
        comment: eventComment,
      });

      if (!skipParticipants) {
        const ratings = participantRatings
          .filter((r) => r.score > 0)
          .map((r) => ({
            ratee_id: r.user.id,
            score: r.score,
            comment: r.comment,
          }));
        if (ratings.length) {
          await api.post("/user-ratings/bulk", { ratings });
        }
      }

      if (ownerRating > 0) {
        await api.post("/user-ratings/bulk", {
          ratings: [
            {
              ratee_id: event.owner_id,
              score: ownerRating,
              comment: ownerComment,
            },
          ],
        });
      }

      onFinish();
    } catch (err) {
      console.error("Failed to submit ratings", err);
      Alert.alert("Failed to submit ratings.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <View>
          <Text style={styles.title}>Rate Event</Text>
          <TextInput
            placeholder="Comment (optional)"
            placeholderTextColor="#999"
            style={styles.input}
            value={eventComment}
            onChangeText={setEventComment}
            multiline
          />
          <Text style={styles.label}>Score:</Text>
          <View style={styles.scoreRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.scoreButton,
                  eventRating === n && styles.scoreButtonActive,
                ]}
                onPress={() => setEventRating(n)}
              >
                <Text style={styles.scoreButtonText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              eventRating === 0 && { opacity: 0.5 },
            ]}
            disabled={eventRating === 0}
            onPress={() => setStep(2)}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 2) {
      return (
        <ScrollView>
          <Text style={styles.title}>Rate Participants</Text>
          {participantRatings.map((p, i) => (
            <View key={p.user.id} style={styles.participantBlock}>
              <Text style={styles.participantName}>
                {p.user.profile?.first_name} {p.user.profile?.last_name}
              </Text>
              <TextInput
                placeholder="Comment"
                placeholderTextColor="#999"
                style={styles.input}
                value={p.comment}
                onChangeText={(text) =>
                  setParticipantRatings((prev) => {
                    const next = [...prev];
                    next[i].comment = text;
                    return next;
                  })
                }
              />
              <View style={styles.scoreRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.scoreButton,
                      p.score === n && styles.scoreButtonActive,
                    ]}
                    onPress={() =>
                      setParticipantRatings((prev) => {
                        const next = [...prev];
                        next[i].score = n;
                        return next;
                      })
                    }
                  >
                    <Text style={styles.scoreButtonText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setSkipParticipants(true);
                setStep(3);
              }}
            >
              <Text style={styles.secondaryButtonText}>Skip All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setStep(3)}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <View>
        <Text style={styles.title}>Rate Host</Text>
        <Text style={styles.participantName}>
          {event.owner.profile?.first_name} {event.owner.profile?.last_name}
        </Text>
        <TextInput
          placeholder="Comment"
          placeholderTextColor="#999"
          style={styles.input}
          value={ownerComment}
          onChangeText={setOwnerComment}
          multiline
        />
        <Text style={styles.label}>Score:</Text>
        <View style={styles.scoreRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.scoreButton,
                ownerRating === n && styles.scoreButtonActive,
              ]}
              onPress={() => setOwnerRating(n)}
            >
              <Text style={styles.scoreButtonText}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          disabled={submitting}
          onPress={submitAll}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Submitting..." : "Submit All"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          {renderStep()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    width: "90%",
    borderRadius: 12,
    maxHeight: "85%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#00796B",
  },
  label: {
    marginTop: 10,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    minHeight: 40,
    marginTop: 6,
    fontSize: 15,
    color: "#333",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  scoreButton: {
    borderWidth: 1,
    borderColor: "#00796B",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  scoreButtonActive: {
    backgroundColor: "#00796B",
  },
  scoreButtonText: {
    color: "#00796B",
    fontWeight: "600",
  },
  participantBlock: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  participantName: {
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: "#00796B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#333",
    fontWeight: "600",
  },
});
