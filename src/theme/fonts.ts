import { BricolageGrotesque_500Medium } from "@expo-google-fonts/bricolage-grotesque/500Medium";
import { BricolageGrotesque_600SemiBold } from "@expo-google-fonts/bricolage-grotesque/600SemiBold";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono/400Regular";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono/500Medium";
import { InstrumentSans_400Regular } from "@expo-google-fonts/instrument-sans/400Regular";
import { InstrumentSans_500Medium } from "@expo-google-fonts/instrument-sans/500Medium";
import { InstrumentSans_600SemiBold } from "@expo-google-fonts/instrument-sans/600SemiBold";
import { InstrumentSans_700Bold } from "@expo-google-fonts/instrument-sans/700Bold";
import { NotoSansJP_700Bold } from "@expo-google-fonts/noto-sans-jp/700Bold";

/**
 * Only the weights the prototype actually uses are imported (per-weight
 * subpaths), so the bundle does not carry every weight of every family.
 * The keys are the font-family names referenced in `tailwind.config.js`.
 */
export const fontAssets = {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
  NotoSansJP_700Bold,
};
