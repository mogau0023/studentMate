import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, LayoutAnimation, UIManager, Platform, Image, ActivityIndicator, Linking, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { collection, query, getDocs, orderBy, } from 'firebase/firestore';
import ImageViewer from 'react-native-image-zoom-viewer';
import { db } from '../firebase';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { useSubscription } from "../providers/SubscriptionProvider";
import * as ScreenCapture from "expo-screen-capture";
import { rewardedUnitId } from '../utils/ads';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function QuestionCard({ question, number }) {
  const [expanded, setExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  // ✅ NEW: RevenueCat subscription status
  const { isPro } = useSubscription();

  // ✅ Keep your rewarded setup, but only use it for FREE users
  const rewardedRef = useRef(null);
  const [rewardLoaded, setRewardLoaded] = useState(false);
  const pendingActionRef = useRef(null); // 'answers' | 'video' | null

  const [contentAspectRatio, setContentAspectRatio] = useState(null);
  const [answerAspectRatio, setAnswerAspectRatio] = useState(null);

  useEffect(() => {
    if (!rewardedRef.current) {
      rewardedRef.current = RewardedAd.createForAdRequest(rewardedUnitId());
    }
    // ✅ Pro users should never load/use rewarded ads
    if (isPro) return;

    const rewarded = rewardedRef.current;
    const l1 = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => setRewardLoaded(true));

    const l2 = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
      // ✅ REMOVED: points awarding (no Firestore writes)
      const act = pendingActionRef.current;
      pendingActionRef.current = null;

      if (act === 'answers') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(true);
      } else if (act === 'video' && question.videoUrl) {
        Linking.openURL(question.videoUrl);
      }
    });

    const l3 = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setRewardLoaded(false);
      rewarded.load();
    });

    rewarded.load();

    return () => {
      l1(); l2(); l3();
    };
  }, [question.videoUrl, isPro]);

  useEffect(() => {
    const uri = question?.contentUrl;
    if (!uri) {
      setContentAspectRatio(null);
      return;
    }
    Image.getSize(
      uri,
      (w, h) => {
        if (w > 0 && h > 0) setContentAspectRatio(w / h);
        else setContentAspectRatio(null);
      },
      () => setContentAspectRatio(null)
    );
  }, [question?.contentUrl]);

  useEffect(() => {
    const uri = question?.answerUrl;
    if (!uri) {
      setAnswerAspectRatio(null);
      return;
    }
    Image.getSize(
      uri,
      (w, h) => {
        if (w > 0 && h > 0) setAnswerAspectRatio(w / h);
        else setAnswerAspectRatio(null);
      },
      () => setAnswerAspectRatio(null)
    );
  }, [question?.answerUrl]);

  const toggleExpand = () => {
    if (expanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(false);
      return;
    }

    // ✅ Pro: no ads, open instantly
    if (isPro) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
      return;
    }

    // ✅ Free: must watch rewarded to open answers (same behavior)
    const rewarded = rewardedRef.current;
    pendingActionRef.current = 'answers';
    try {
      if (rewardLoaded) {
        rewarded.show();
      } else {
        rewarded.load();
        Alert.alert('Loading', 'Preparing rewarded ad. Try again in a moment.');
      }
    } catch (e) {
      console.log('Rewarded show failed', e);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
    }
  };

  const openVideo = () => {
    // ✅ Pro: open directly
    if (isPro) {
      if (question.videoUrl) Linking.openURL(question.videoUrl);
      else Alert.alert('No Video', 'Video solution is not available for this question.');
      return;
    }

    // ✅ Free: if you want video to also be gated by rewarded, use rewarded
    // Keeping your original behavior = open directly (no rewarded) ✅
    if (question.videoUrl) {
      Linking.openURL(question.videoUrl);
    } else {
      Alert.alert('No Video', 'Video solution is not available for this question.');
    }
  };

  const showImage = (uri) => {
    setCurrentImage([{ url: uri }]);
    setIsVisible(true);
  };

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionTitleRow}>
          <View style={styles.blueBar} />
          <Text style={styles.questionTitle}>Question {question.order || number}</Text>
        </View>
        <View style={styles.marksBadge}>
          <Text style={styles.marksText}>{question.marks || 0}</Text>
        </View>
      </View>

      <View style={styles.questionBody}>
        {(() => {
          const t = question?.title || '';
          const n = question?.order || number;
          const r = new RegExp(`^(?:question|q)\\s*${n}\\s*[:.)-]*\\s*`, 'i');
          const cleaned = t.replace(r, '').trim();
          return cleaned ? <Text style={styles.questionText}>{cleaned}</Text> : null;
        })()}

        {question.contentUrl && (
          <TouchableOpacity onPress={() => showImage(question.contentUrl)}>
            <Image
              source={{ uri: question.contentUrl }}
              style={[
                styles.contentImage,
                contentAspectRatio ? { aspectRatio: contentAspectRatio } : { height: 200 }
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.viewAnswersBtn} onPress={toggleExpand}>
          <Text style={styles.viewAnswersText}>{expanded ? 'Hide Answers' : 'View Answers'}</Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#0053A9" />
        </TouchableOpacity>

        {question.videoUrl && (
          <TouchableOpacity style={styles.videoSolutionBtn} onPress={openVideo}>
            <Text style={styles.videoSolutionText}>Video solution</Text>
          </TouchableOpacity>
        )}
      </View>

      {expanded && (
        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Answer:</Text>
          {question.answerUrl ? (
            <TouchableOpacity onPress={() => showImage(question.answerUrl)}>
              <Image
                source={{ uri: question.answerUrl }}
                style={[
                  styles.answerImage,
                  answerAspectRatio ? { aspectRatio: answerAspectRatio } : { height: 200 }
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <Text style={styles.answerText}>No answer image available.</Text>
          )}
        </View>
      )}

      <Modal visible={isVisible} transparent={true} onRequestClose={() => setIsVisible(false)}>
        {currentImage && (
          <ImageViewer
            imageUrls={currentImage}
            onCancel={() => setIsVisible(false)}
            enableSwipeDown={true}
            onSwipeDown={() => setIsVisible(false)}
            renderIndicator={() => null}
          />
        )}
      </Modal>
    </View>
  );
}

export default function AssessmentViewerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { assessment } = route.params;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch { }
    })();

    return () => {
      (async () => {
        try {
          await ScreenCapture.allowScreenCaptureAsync();
        } catch { }
      })();
    };
  }, []);

  const fetchQuestions = async () => {
    try {
      // Assuming 'questions' is a subcollection of 'assessments'
      const q = query(
        collection(db, 'assessments', assessment.id, 'questions'),
        orderBy('order', 'asc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setQuestions(data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Fallback: check if questions are embedded in the assessment document itself (as array)
      if (assessment.questions && Array.isArray(assessment.questions)) {
        setQuestions(assessment.questions);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#0053A9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{assessment.title || 'Assessment'}</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="file-text" size={24} color="#0053A9" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0053A9" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          {questions.length > 0 ? (
            questions.map((q, index) => (
              <QuestionCard key={q.id || index} question={q} number={index + 1} />
            ))
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No questions found for this assessment.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0053A9', flex: 1, textAlign: 'center', textTransform: 'uppercase' },
  content: { padding: 16 },

  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blueBar: {
    width: 4,
    height: 24,
    backgroundColor: '#0053A9',
    borderRadius: 2,
    marginRight: 12,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0053A9',
  },
  marksBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  marksText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0053A9',
  },
  questionBody: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 8,
  },
  mathPlaceholder: {
    alignItems: 'center',
    marginVertical: 12,
  },
  mathText: {
    fontStyle: 'italic',
    fontSize: 16,
    color: '#111827',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewAnswersBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  viewAnswersText: {
    color: '#0053A9',
    fontWeight: '600',
    fontSize: 14,
  },
  videoSolutionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fb',
    paddingVertical: 10,
    borderRadius: 24,
  },
  videoSolutionText: {
    color: '#0053A9',
    fontWeight: '600',
    fontSize: 14,
  },
  answerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  contentImage: {
    width: '100%',
    marginTop: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  answerImage: {
    width: '100%',
    marginTop: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
