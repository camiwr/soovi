import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import GoogleLogo from "@/assets/images/svg/google-logo.svg";

type Props = {
  onPress: () => void;
  loading?: boolean;
};

const GoogleSignInButton: React.FC<Props> = ({ onPress, loading = false }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading}
      style={{
        marginTop: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#DADCE0",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        opacity: loading ? 0.7 : 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <GoogleLogo width={18} height={18} />
        </View>

        <Text
          style={{
            fontSize: 14,
            color: "#3C4043",
            fontWeight: "500",
          }}
        >
          {loading ? "Conectando..." : "Entrar com Google"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default GoogleSignInButton;




// import React from "react";
// import { GoogleSigninButton } from "@react-native-google-signin/google-signin";

// type Props = {
//   loading?: boolean;
//   onPress: () => void;
// };

// export function GoogleAuthButton({ loading, onPress }: Props) {
//   return (
//     <GoogleSigninButton
//       style={{
//         width: "100%",
//         height: 52,
//         borderRadius: 10,
//         alignSelf: "center",
//         opacity: loading ? 0.7 : 1,
//       }}
//       size={GoogleSigninButton.Size.Wide}
//       color={GoogleSigninButton.Color.Dark}
//       onPress={onPress}
//       disabled={loading}
//     />
//   );
// }

// // import React, { useState } from "react";
// // import { Text, TouchableOpacity, View } from "react-native";
// // import GoogleLogo from "@/assets/images/svg/google-logo.svg";
// // import { GoogleSignin, User, isSuccessResponse } from "@react-native-google-signin/google-signin";

// // //remover posteriormente para variaveis de ambiente 
// // GoogleSignin.configure({
// //   iosClientId:"998161092266-gg85ijqmb2apd1eddg29ulju6ere7hsl.apps.googleusercontent.com",
// // })

// // export default function GoogleSignInButton() {
// //     const [auth, setAuth] = useState<User | null>(null);

// //     async function handleGoogleSignIn() {
// //       try {
// //        await GoogleSignin.hasPlayServices();
// //        const response = await GoogleSignin.signIn();

// //         if (isSuccessResponse(response)) {  
// //           console.log(response.data);
// //           setAuth(response.data);
// //         }
// //       } catch (error) {
// //         console.log("Erro ao fazer login com Google: ", error);
// //       }
// //     }

// //     return (
// //     <TouchableOpacity
// //       activeOpacity={0.8}
// //       onPress={handleGoogleSignIn}
// //       style={{
// //         marginTop: 12,
// //         borderRadius: 999,
// //         borderWidth: 1,
// //         borderColor: "#DADCE0",
// //         backgroundColor: "#FFFFFF",
// //         paddingHorizontal: 16,
// //         paddingVertical: 10,
// //         shadowColor: "#000",
// //         shadowOffset: { width: 0, height: 1 },
// //         shadowOpacity: 0.08,
// //         shadowRadius: 2,
// //         elevation: 2,
// //       }}
// //     >
// //       <View
// //         style={{
// //           flexDirection: "row",
// //           alignItems: "center",
// //           justifyContent: "center",
// //         }}
// //       >
// //         <View
// //           style={{
// //             width: 22,
// //             height: 22,
// //             borderRadius: 11,
// //             backgroundColor: "#FFFFFF",
// //             justifyContent: "center",
// //             alignItems: "center",
// //             marginRight: 12,
// //           }}
// //         >
// //           <GoogleLogo width={18} height={18} />
// //         </View>

// //           <Text
// //             style={{
// //               fontSize: 14,
// //               color: "#3C4043",
// //               fontWeight: "500",
// //             }}
// //           >
// //             Entrar com Google
// //           </Text>
// //       </View>
// //     </TouchableOpacity>
// //   );
// // };


// // // const GoogleSignInButton: React.FC<Props> = ({ onPress, loading }) => {

// // //   return (
// // //     <TouchableOpacity
// // //       activeOpacity={0.8}
// // //       onPress={onPress}
// // //       disabled={loading}
// // //       style={{
// // //         marginTop: 12,
// // //         borderRadius: 999,
// // //         borderWidth: 1,
// // //         borderColor: "#DADCE0",
// // //         backgroundColor: "#FFFFFF",
// // //         paddingHorizontal: 16,
// // //         paddingVertical: 10,
// // //         // sombra leve
// // //         shadowColor: "#000",
// // //         shadowOffset: { width: 0, height: 1 },
// // //         shadowOpacity: 0.08,
// // //         shadowRadius: 2,
// // //         elevation: 2,
// // //       }}
// // //     >
// // //       <View
// // //         style={{
// // //           flexDirection: "row",
// // //           alignItems: "center",
// // //           justifyContent: "center",
// // //         }}
// // //       >
// // //         <View
// // //           style={{
// // //             width: 22,
// // //             height: 22,
// // //             borderRadius: 11,
// // //             backgroundColor: "#FFFFFF",
// // //             justifyContent: "center",
// // //             alignItems: "center",
// // //             marginRight: 12,
// // //           }}
// // //         >
// // //           <GoogleLogo width={18} height={18} />
// // //         </View>

// // //         {loading ? (
// // //           <ActivityIndicator size="small" color="#5F6368" />
// // //         ) : (
// // //           <Text
// // //             style={{
// // //               fontSize: 14,
// // //               color: "#3C4043",
// // //               fontWeight: "500",
// // //             }}
// // //           >
// // //             Entrar com Google
// // //           </Text>
// // //         )}
// // //       </View>
// // //     </TouchableOpacity>
// // //   );
// // // };

// // // export default GoogleSignInButton;
