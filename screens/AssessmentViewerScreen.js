import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, LayoutAnimation, UIManager, Platform, Image, ActivityIndicator, Linking, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import ImageViewer from 'react-native-image-zoom-viewer';
import { db } from '../firebase';
//import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import * as ScreenCapture from 'expo-screen-capture';
import { adsEnabled, interstitialUnitId } from '../utils/ads';
import { ScreenHeader } from '../components/UI';
import { colors, cardShadow, isWebDark } from '../utils/webTheme';
import { trackError, trackEvent } from '../utils/analytics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function useImageAspectRatio(uri) {
  const [aspectRatio, setAspectRatio] = useState(null);

  useEffect(() => {
    if (!uri) {
      setAspectRatio(null);
      return;
    }

    Image.getSize(
      uri,
      (w, h) => {
        if (w > 0 && h > 0) setAspectRatio(w / h);
        else setAspectRatio(null);
      },
      () => setAspectRatio(null)
    );
  }, [uri]);

  return aspectRatio;
}

function getDisplayTitle(question, number) {
  const raw = question?.title || '';
  const n = question?.order || number;
  const r = new RegExp(`^(?:question|q)\\s*${n}\\s*[:.)-]*\\s*`, 'i');
  return raw.replace(r, '').trim();
}

function FirebaseImage({ uri, aspectRatio, style, onPress }) {
  const [loadingImage, setLoadingImage] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLoadingImage(!!uri);
    setHasError(false);
  }, [uri]);

  if (!uri) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} disabled={!onPress} style={styles.imageTouch}>
      <View style={[styles.imageFrame, isWebDark && styles.imageFrameDark]}>
        <Image
          source={{ uri }}
          style={[
            style,
            aspectRatio ? { aspectRatio } : { height: 200 },
            isWebDark && styles.imageDarkMode,
          ]}
          resizeMode="contain"
          onLoadStart={() => {
            setLoadingImage(true);
            setHasError(false);
          }}
          onLoadEnd={() => setLoadingImage(false)}
          onError={() => {
            setLoadingImage(false);
            setHasError(true);
          }}
        />

        {loadingImage ? (
          <View style={styles.imageLoaderOverlay}>
            <ActivityIndicator size="small" color={colors.brand} />
          </View>
        ) : null}

        {hasError ? (
          <View style={styles.imageLoaderOverlay}>
            <Text style={styles.imageErrorText}>Failed to load image.</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function QuestionCard({ question, number, assessmentId, moduleId, assessmentType }) {
  const [expanded, setExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const contentAspectRatio = useImageAspectRatio(question?.contentUrl);
  const answerAspectRatio = useImageAspectRatio(question?.answerUrl);
  const title = getDisplayTitle(question, number);

  const toggleExpand = () => {
    if (expanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(false);
      return;
    }

    trackEvent('answer_reveal', {
      assessment_id: String(assessmentId || ''),
      module_id: String(moduleId || ''),
      type: String(assessmentType || ''),
      question_order: question?.order || number,
    });

    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
    } catch (e) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
    }
  };

  const openVideo = () => {
    if (question.videoUrl) {
      trackEvent('video_solution_open', {
        assessment_id: String(assessmentId || ''),
        module_id: String(moduleId || ''),
        type: String(assessmentType || ''),
        question_order: question?.order || number,
      });
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
        {title ? <Text style={styles.questionText}>{title}</Text> : null}

        {question.contentUrl && (
          <FirebaseImage
            uri={question.contentUrl}
            aspectRatio={contentAspectRatio}
            style={styles.contentImage}
            onPress={() => showImage(question.contentUrl)}
          />
        )}
      </View>

      <View style={styles.cardActions}>
        {question.answerUrl && (
          <TouchableOpacity style={styles.viewAnswersBtn} onPress={toggleExpand}>
            <Text style={styles.viewAnswersText}>{expanded ? 'Hide Answers' : 'View Answers'}</Text>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.brand} />
          </TouchableOpacity>
        )}

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
            <FirebaseImage
              uri={question.answerUrl}
              aspectRatio={answerAspectRatio}
              style={styles.answerImage}
              onPress={() => showImage(question.answerUrl)}
            />
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
  const viewStartRef = useRef(Date.now());

  const interstitialRef = useRef(null);
  const interstitialLoadedRef = useRef(false);
  const pendingLeaveActionRef = useRef(null);
  const isHandlingLeaveRef = useRef(false);

  useEffect(() => {
    if (!adsEnabled()) return;

    if (!interstitialRef.current) {
      interstitialRef.current = InterstitialAd.createForAdRequest(interstitialUnitId());
    }

    const interstitial = interstitialRef.current;
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadedRef.current = true;
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoadedRef.current = false;
      try {
        interstitial.load();
      } catch {}

      const action = pendingLeaveActionRef.current;
      pendingLeaveActionRef.current = null;
      if (action) navigation.dispatch(action);
      isHandlingLeaveRef.current = false;
    });
    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoadedRef.current = false;
      const action = pendingLeaveActionRef.current;
      pendingLeaveActionRef.current = null;
      if (action) navigation.dispatch(action);
      isHandlingLeaveRef.current = false;
    });

    interstitial.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [navigation]);

  useEffect(() => {
    if (!adsEnabled()) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const actionType = e?.data?.action?.type;
      if (actionType !== 'POP' && actionType !== 'GO_BACK') return;
      if (isHandlingLeaveRef.current) return;
      if (!interstitialLoadedRef.current) return;

      e.preventDefault();
      isHandlingLeaveRef.current = true;
      pendingLeaveActionRef.current = e.data.action;

      try {
        interstitialRef.current?.show();
      } catch {
        const action = pendingLeaveActionRef.current;
        pendingLeaveActionRef.current = null;
        isHandlingLeaveRef.current = false;
        if (action) navigation.dispatch(action);
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    (async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch {}
    })();

    return () => {
      (async () => {
        try {
          await ScreenCapture.allowScreenCaptureAsync();
        } catch {}
      })();
    };
  }, []);

  const fetchQuestions = async () => {
    try {
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
      trackError(error, 'fetch_questions');
      if (assessment.questions && Array.isArray(assessment.questions)) {
        setQuestions(assessment.questions);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    viewStartRef.current = Date.now();
    trackEvent('assessment_view', {
      assessment_id: String(assessment?.id || ''),
      module_id: String(assessment?.moduleId || ''),
      type: String(assessment?.type || ''),
    });
    fetchQuestions();
    return () => {
      const durationMs = Date.now() - (viewStartRef.current || Date.now());
      trackEvent('assessment_view_time', {
        assessment_id: String(assessment?.id || ''),
        module_id: String(assessment?.moduleId || ''),
        type: String(assessment?.type || ''),
        duration_ms: durationMs,
      });
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={assessment.title || 'Assessment'}
        onBack={() => navigation.goBack()}
        iconColor={colors.brand}
        containerStyle={styles.header}
        titleStyle={styles.headerTitle}
        buttonStyle={styles.headerButton}
        rightIconName="file-text"
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0053A9" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          {questions.length > 0 ? (
            questions.map((q, index) => (
              <QuestionCard
                key={q.id || index}
                question={q}
                number={index + 1}
                assessmentId={assessment?.id}
                moduleId={assessment?.moduleId}
                assessmentType={assessment?.type}
              />
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
  safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.brand, flex: 1, textAlign: 'center', textTransform: 'uppercase' },
  content: { padding: 16 },

  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...cardShadow,
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
    backgroundColor: colors.brand,
    borderRadius: 2,
    marginRight: 12,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand,
  },
  marksBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  marksText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand,
  },
  questionBody: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 15,
    color: colors.textSoft,
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
    color: colors.text,
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
    backgroundColor: colors.accentSoft,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  viewAnswersText: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 14,
  },
  videoSolutionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 10,
    borderRadius: 24,
  },
  videoSolutionText: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 14,
  },
  answerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 20,
  },
  imageTouch: {
    marginTop: 12,
  },
  imageFrame: {
    position: 'relative',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
  },
  imageFrameDark: {
    backgroundColor: '#0a0f1a',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  imageLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  imageErrorText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  imageDarkMode: Platform.select({
    web: {
      filter: 'invert(1) hue-rotate(180deg) contrast(0.92) brightness(0.9)',
    },
    default: null,
  }),
  contentImage: {
    width: '100%',
  },
  answerImage: {
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
  },
});
