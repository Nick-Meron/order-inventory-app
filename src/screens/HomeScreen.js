import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export default function HomeScreen({ user, onLogout }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.hello}>Hello, {user.name}</Text>
        <Text style={styles.role}>Logged in as {user.role}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.text}>Login works. The product list comes next.</Text>

        <Pressable style={styles.button} onPress={onLogout}>
          <Text style={styles.buttonText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.green,
    paddingTop: 90,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  hello: { fontFamily: fonts.bold, fontSize: 28, color: colors.saffron },
  role: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.background,
    marginTop: 8,
  },
  body: { padding: 24 },
  text: { fontFamily: fonts.regular, fontSize: 18, color: colors.text },
  button: {
    backgroundColor: colors.saffron,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 28,
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 18, color: colors.green },
});