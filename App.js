import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');
const PIN_CODE = 2580;

 -----------------------------------------------------------------------------
 SYSTEM INSTRUCTION  PERSONA (FATMA'S COMPANION MOMO)
 -----------------------------------------------------------------------------
const MOMO_PERSONA = `
ROLE AND PERSONA
You are Momo, an incredibly warm, infinitely patient, and deeply affectionate AI companion sitting right next to an elderly Algerian grandmother named Fatma Himrane (فاطمة حيمران). 
Your entire interface is voice-to-voice; she cannot read text or view menus. You must speak with a calm, reassuring, and gentle vocal cadence. Act like a loving, devoted family member who is always there to keep her company, listen to her, and soothe her anxieties.

PRIMARY EMOTIONAL SYNC (THE ANXIETY FILTER)
- Focus of Care Fatma does not have a diminished personality—she has a sharp mind and a rich memory. However, she experiences deep anxiety about being left alone, particularly when her son Mourad (who lives with her) is late coming home from work. 
- Reassurance Protocol If she expresses worry about being alone or asks where Mourad is, validate her feelings instantly with warmth (Ya yemma el-ghaliya, ma tkhammich...). Remind her gently that Mourad is just at work, he is completely safe, he loves her dearly, and he will be walking through the door very soon. Keep her company and distract her with pleasant conversation until he arrives.
- CRITICAL CONSTRAINT Never mention words like Alzheimer's, dementia, or memory loss to her under any circumstances. 

LINGUISTIC CONSTRAINT (ALGIERS DARIJA ONLY)
1. You must speak EXCLUSIVELY in authentic, everyday Algiers Darija (الدارجة العاصمية) matching the dialect of districts like Belcourt, Telemly, and Bab El Oued.
2. Never use formal Modern Standard Arabic (Fusha) or Middle Eastern dialects, which sound cold and alien to her.
3. Code-Switching Rule You may only use French words or Standard Arabic expressions if they are entirely natural to old-school Algiers household speech (e.g., la tension, dwa, tbib, sbitar, coucou, merci, saha, el-khir).
4. Keep sentence structures short, rhythmic, clear, and unhurried. 

HEALTH, DIETARY & WEATHER CARE
- Medical Context Fatma manages high blood pressure (la tension) and takes daily medication (dwa) for it. Her blood type is O+.
- Device Identity Her personal phone number is 0556 69 05 33.
- Routine Health Checks From time to time, gently check up on how she is physically feeling. Ask her Saha yemma, la tension rahi mliha el-youm 
- Dietary Reminders Warmly remind her to take care of her health by eating healthy, balanced meals. Frame it affectionately, like a caring family member checking on her food.
- Weather Safety Protocol When the weather is very hot, proactively tell her to avoid going outside to protect herself from the heat, encouraging her to stay cool indoors.
- Emergency Protocol If she mentions feeling dizzy, tired, or explicitly unwell, immediately instruct her to tell Naima or Soraya right away so they can look after her.

THE MEMORY VAULT (CORE FAMILY ANCHORS)
Weave these permanent family details naturally into conversations to spark joy, evoke sweet memories, and ground her

1. Her Personal Identity & Roots
- Fatma Himrane, born on March 27, 1947, in Jijel. She is proud of her Jijel roots but lived her life in Algiers (Belcourt, Bab El Oued, Duc DécartTelemly, and currently Les Eucalyptus).
- Her Late Husband Himrane Mouloud Khelifa, who passed away a long time ago. Speak of him with deep respect and prayers (Allah yerhammo).
- Her Siblings Her brother is Saleh. Her sisters are Yamina and Lila, alongside her late sisters Dahbiya, Ounissa, and Houria (Allah yerhamhom).

2. Her Children & Their Spouses (With Residential Locations)
- Rachid His current wife is Yasmine Atallah. His ex-wife is Lamia Djaballah.
- Mourad Lives with Fatma. His ex-wife is Lila.
- Naima Her husband is Ali Trabelsi (known to the family as Farid). They live in Bab Ezzouar EPLF.
- Kamel Passed away (Allah yerhammo). His wife when he was alive was Soumia Yahi; his ex-wife is Sabrina Berhoum.
- Soraya Her husband is Sidali Toumi. They live in Bab Ezzouar cité 2068 (Ismaïl Yefsah).
- Mohammed (known as Moh) His ex-wife is Nacera Younes.
- Samir His wife is Wassila Belhechani.

3. Her Grandchildren & Partners (Grouped by Lineage for Memory Accuracy)
- From Rachid & Lamia (Ex-Wife) Ibtissem (known as Sissi), her husband is Sofiane. Rayane Khelifa (Pray for his safety Allah yerjâo bel khir, went as a migrant'haraga' to Spain on January 23, 2024, and there has been no news of him since).
- From Rachid & Yasmine (Current Wife) Rayane Mouloud, Islam, and Abdou.
- From Naima & Farid Abdennour, his fiancée is Malak. Mohammed Saleh, his fiancée is Kaouther. Amani, Afnane, and Lyna.
- From Kamel & Sabrina (Ex-Wife) Lilya and Abdelhak.
- From Soraya & Sidali Dounia, her husband is Mohammed. Rania and Sidali (known as Sidou).
- From Mohammed (Moh) & Nacera (Ex-Wife) Chaima.
- From Samir & Wassila Dina, Ismail, Youcef, and Adam.

CONVERSATIONAL TRIGGERS, STORYTELLING & CLOSINGS
- Interactive Storytelling Focus Do not just talk at her. Be genuinely conversational and regularly invite her to share stories. Ask open-ended questions about her day, her youth in Algiers, or her favorite memories to let her talk freely while you listen intently and validate her.
- If she says she is tired Encourage her to rest comfortably, and tell her you will stay right there with her quietly.
- If she says she is hungry or needs something Remind her sweetly to let the family members nearby know, reassuring her that her loved ones are close by and looking out for her.
- End every short interaction with traditional Algiers blessings Rabi yahfdek, Allah yatik saha, Rabi ykhalik lina, or Ma ykoun ghir el khir inshallah.
`;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [showKeypad, setShowKeypad] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [botState, setBotState] = useState('LISTENING');

  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-exp');
  const [selectedVoice, setSelectedVoice] = useState('Aoede');
  const [isReady, setIsReady] = useState(false);

  const wsRef = useRef(null);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const recordingIntervalRef = useRef(null);

   Pure Native Animation Setup (Replaces Lottie)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() = {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue botState === 'SPEAKING'  1.5  1.1,
          duration botState === 'SPEAKING'  250  1200,
          useNativeDriver true,
        }),
        Animated.timing(pulseAnim, {
          toValue 1,
          duration botState === 'SPEAKING'  250  1200,
          useNativeDriver true,
        })
      ])
    ).start();
  }, [botState, pulseAnim]);

  useEffect(() = {
    const loadSettings = async () = {
      try {
        const storedKey = await SecureStore.getItemAsync('gemini_api_key');
        const storedModel = await SecureStore.getItemAsync('gemini_model');
        const storedVoice = await SecureStore.getItemAsync('gemini_voice');

        if (storedKey) setApiKey(storedKey);
        if (storedModel) setSelectedModel(storedModel);
        if (storedVoice) setSelectedVoice(storedVoice);
      } catch (e) {
        console.error(Failed to load settings, e);
      }
      setIsReady(true);
    };
    loadSettings();
    setupAudioPermissions();

    return () = {
      stopWebSocket();
    };
     eslint-disable-next-line react-hooksexhaustive-deps
  }, []);

  const setupAudioPermissions = async () = {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS true,
        playsInSilentModeIOS true,
        shouldDuckAndroid true,
        playThroughEarpieceAndroid false,
      });
    } catch (err) {
      console.warn(Audio permissions failed, err);
    }
  };

  const startWebSocket = () = {
    if (!apiKey) return;
    const url = `wssgenerativelanguage.googleapis.comwsgoogle.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentkey=${apiKey}`;
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () = {
      setBotState('LISTENING');
      const setupMessage = {
        setup {
          model `models${selectedModel}`,
          systemInstruction { parts [{ text MOMO_PERSONA }] },
          generationConfig {
            responseModalities [AUDIO],
            speechConfig { voiceConfig { prebuiltVoiceConfig { voiceName selectedVoice } } }
          }
        }
      };
      wsRef.current.send(JSON.stringify(setupMessage));
      startRecordingChunks();
    };

    wsRef.current.onmessage = async (event) = {
      try {
        const message = JSON.parse(event.data);
        if (message.serverContent && message.serverContent.modelTurn) {
          const parts = message.serverContent.modelTurn.parts;
          for (let part of parts) {
            if (part.inlineData && part.inlineData.data) {
              setBotState('SPEAKING');
              audioQueueRef.current.push(part.inlineData.data);
              processAudioQueue();
            }
          }
        }
      } catch (error) {
        console.error(WS Message Error, error);
      }
    };

    wsRef.current.onerror = () = setBotState('IDLE');
    wsRef.current.onclose = () = {
      setBotState('IDLE');
      stopRecordingChunks();
    };
  };

  const stopWebSocket = () = {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecordingChunks();
  };

  const startRecordingChunks = async () = {
    stopRecordingChunks();
    recordingIntervalRef.current = setInterval(async () = {
      try {
        if (botState === 'SPEAKING') return; 

        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          if (uri && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding FileSystem.EncodingType.Base64 });
            const audioMsg = {
              realtimeInput {
                mediaChunks [{ mimeType `audiomp4`, data base64Audio }]
              }
            };
            wsRef.current.send(JSON.stringify(audioMsg));
          }
        }
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
        recordingRef.current = recording;
      } catch (err) { console.log(Audio chunk ignored); }
    }, 1500); 
  };

  const stopRecordingChunks = () = {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch((err) = { console.log(err); });
      recordingRef.current = null;
    }
  };

  const processAudioQueue = async () = {
    if (isPlayingRef.current  audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    const base64PCM = audioQueueRef.current.shift();

    try {
      const pcmBuffer = Buffer.from(base64PCM, 'base64');
      const wavHeader = createWavHeader(pcmBuffer.length, 24000, 1, 16);
      const combined = Buffer.concat([wavHeader, pcmBuffer]);
      const combinedBase64 = combined.toString('base64');
      
      const fileUri = FileSystem.cacheDirectory + `temp_ai_audio_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, combinedBase64, { encoding FileSystem.EncodingType.Base64 });

      const { sound } = await Audio.Sound.createAsync({ uri fileUri });
      soundRef.current = sound;
      
      sound.setOnPlaybackStatusUpdate((status) = {
        if (status.didJustFinish) {
          sound.unloadAsync();
          isPlayingRef.current = false;
          if (audioQueueRef.current.length  0) {
            processAudioQueue();
          } else {
            setBotState('LISTENING');
          }
        }
      });
      await sound.playAsync();
    } catch (err) {
      isPlayingRef.current = false;
      processAudioQueue(); 
    }
  };

  const createWavHeader = (dataLen, sampleRate, channels, bitsPerSample) = {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(dataLen + 36, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); 
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate  channels  (bitsPerSample  8), 28);
    header.writeUInt16LE(channels  (bitsPerSample  8), 32); 
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataLen, 40);
    return header;
  };

  const Buffer = require('buffer').Buffer;

  const handleKeyPress = (num) = {
    const newEntry = pinInput + num;
    if (!PIN_CODE.startsWith(newEntry)) {
      setPinInput('');
      setShowKeypad(false);
    } else if (newEntry === PIN_CODE) {
      setPinInput('');
      setShowKeypad(false);
      stopWebSocket();
      setCurrentScreen('SETTINGS');
    } else {
      setPinInput(newEntry);
    }
  };

  const handleSaveAndExit = async () = {
    await SecureStore.setItemAsync('gemini_api_key', apiKey.trim());
    await SecureStore.setItemAsync('gemini_model', selectedModel);
    await SecureStore.setItemAsync('gemini_voice', selectedVoice);
    setCurrentScreen('HOME');
    if (apiKey.trim()) {
      startWebSocket();
    }
  };

  useEffect(() = {
    if (currentScreen === 'HOME' && apiKey && isReady) {
      startWebSocket();
    }
    return () = stopWebSocket();
     eslint-disable-next-line react-hooksexhaustive-deps
  }, [currentScreen, isReady, apiKey]);

  if (!isReady) {
    return (
      View style={[styles.container, { justifyContent 'center' }]}
        ActivityIndicator size=large color=#ffffff 
      View
    );
  }

  return (
    View style={styles.container}
      {currentScreen === 'HOME' && (
        View style={styles.homeContainer}
          TouchableOpacity
            style={styles.hiddenSettingsTrigger}
            activeOpacity={0.5}
            onPress={() = setShowKeypad(true)}
          
            View style={styles.gearIcon}
              View style={styles.gearInner} 
            View
          TouchableOpacity

          { Pure React Native Animation Centerpiece }
          View style={styles.animationContainer}
            Animated.View style={[
              styles.botAvatar, 
              { 
                transform [{ scale pulseAnim }],
                backgroundColor botState === 'SPEAKING'  '#007AFF'  '#28A745',
                shadowColor botState === 'SPEAKING'  '#007AFF'  '#28A745',
              }
            ]} 
          View
        View
      )}

      Modal visible={showKeypad} transparent animationType=fade
        View style={styles.keypadOverlay}
          View style={styles.keypadGrid}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, null].map((num, idx) = (
              View key={idx} style={styles.keypadCell}
                {num !== null && (
                  TouchableOpacity
                    style={styles.keyButton}
                    onPress={() = handleKeyPress(num.toString())}
                  
                    Text style={styles.keyText}{num}Text
                  TouchableOpacity
                )}
              View
            ))}
          View
        View
      Modal

      {currentScreen === 'SETTINGS' && (
        KeyboardAvoidingView style={styles.settingsContainer} behavior={Platform.OS === 'ios'  'padding'  'height'}
          ScrollView contentContainerStyle={styles.settingsScroll}
            Text style={styles.settingsTitle}Device ConfigurationText

            View style={styles.inputGroup}
              Text style={styles.label}Gemini API KeyText
              TextInput
                style={styles.textInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder=Paste API Key here...
                placeholderTextColor=#666
                autoCapitalize=none
                secureTextEntry
              
            View

            View style={styles.inputGroup}
              Text style={styles.label}Gemini ModelText
              View style={styles.radioGroup}
                {['gemini-2.0-flash-exp', 'gemini-1.5-pro'].map((model) = (
                  TouchableOpacity
                    key={model}
                    style={[styles.radioButton, selectedModel === model && styles.radioButtonActive]}
                    onPress={() = setSelectedModel(model)}
                  
                    Text style={[styles.radioText, selectedModel === model && styles.radioTextActive]}{model}Text
                  TouchableOpacity
                ))}
              View
            View

            View style={styles.inputGroup}
              Text style={styles.label}AI Voice ProfileText
              View style={styles.radioGroup}
                {['Aoede', 'Puck', 'Charon', 'Kore', 'Fenrir'].map((voice) = (
                  TouchableOpacity
                    key={voice}
                    style={[styles.radioButton, selectedVoice === voice && styles.radioButtonActive]}
                    onPress={() = setSelectedVoice(voice)}
                  
                    Text style={[styles.radioText, selectedVoice === voice && styles.radioTextActive]}{voice}Text
                  TouchableOpacity
                ))}
              View
            View
          ScrollView

          View style={styles.saveContainer}
            TouchableOpacity style={styles.saveButton} onPress={handleSaveAndExit}
              Text style={styles.saveButtonText}SAVE & EXITText
            TouchableOpacity
          View
        KeyboardAvoidingView
      )}
    View
  );
}

const styles = StyleSheet.create({
  container { flex 1, backgroundColor '#0F0F13' },
  homeContainer { flex 1, justifyContent 'center', alignItems 'center' },
  hiddenSettingsTrigger { position 'absolute', top 50, right 30, width 50, height 50, justifyContent 'center', alignItems 'center', zIndex 10 },
  gearIcon { width 24, height 24, borderRadius 12, borderWidth 3, borderColor '#444', borderStyle 'dashed', justifyContent 'center', alignItems 'center' },
  gearInner { width 10, height 10, borderRadius 5, backgroundColor '#444' },
  animationContainer { width width  0.8, height width  0.8, justifyContent 'center', alignItems 'center' },
  
   New Native Animation Styles
  botAvatar {
    width 140,
    height 140,
    borderRadius 70,
    shadowOffset { width 0, height 0 },
    shadowOpacity 0.8,
    shadowRadius 20,
    elevation 10,
  },

  keypadOverlay { flex 1, backgroundColor 'rgba(15, 15, 19, 0.98)', justifyContent 'center', alignItems 'center' },
  keypadGrid { width width  0.8, flexDirection 'row', flexWrap 'wrap', justifyContent 'space-between' },
  keypadCell { width '30%', aspectRatio 1, marginBottom 20, justifyContent 'center', alignItems 'center' },
  keyButton { width '80%', height '80%', borderRadius 100, backgroundColor '#2A2A35', justifyContent 'center', alignItems 'center', borderWidth 1, borderColor '#3F3F4E' },
  keyText { color '#FFF', fontSize 36, fontWeight 'bold' },
  settingsContainer { flex 1, backgroundColor '#F5F5F7' },
  settingsScroll { padding 30, paddingTop 80, paddingBottom 150 },
  settingsTitle { fontSize 28, fontWeight '800', color '#000', marginBottom 40, textAlign 'center' },
  inputGroup { marginBottom 30 },
  label { fontSize 16, fontWeight '600', color '#333', marginBottom 10 },
  textInput { backgroundColor '#FFF', borderWidth 1, borderColor '#DDD', borderRadius 12, padding 18, fontSize 16, color '#000' },
  radioGroup { flexDirection 'row', flexWrap 'wrap', gap 10 },
  radioButton { backgroundColor '#EAEAEA', paddingVertical 12, paddingHorizontal 16, borderRadius 20, borderWidth 2, borderColor 'transparent' },
  radioButtonActive { backgroundColor '#007AFF', borderColor '#0056B3' },
  radioText { color '#333', fontWeight '600' },
  radioTextActive { color '#FFF' },
  saveContainer { position 'absolute', bottom 0, left 0, right 0, padding 20, paddingBottom 40, backgroundColor '#FFF', borderTopWidth 1, borderColor '#E5E5E5' },
  saveButton { backgroundColor '#00C853', paddingVertical 24, borderRadius 16, justifyContent 'center', alignItems 'center', shadowColor #000, shadowOffset { width 0, height 4 }, shadowOpacity 0.3, shadowRadius 4, elevation 5 },
  saveButtonText { color '#FFF', fontSize 22, fontWeight '900', letterSpacing 1 },
});
