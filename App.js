import React from "react";
import {
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Camera, Permissions, FaceDetector, MediaLibrary } from "expo";
import styled from "styled-components";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const ALBUM_NAME = "Smilely Cam";

const CenterView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: cornflowerblue;
`;

const Text = styled.Text`
  color: white;
  font-size: 22px;
`;

const IconBar = styled.View`
  margin-top: 40px;
`;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasPermission: null,
      cameraType: Camera.Constants.Type.front,
      smileDetected: false,
    };
    this.cameraRef = React.createRef();
  }

  componentDidMount = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === "granted") {
      this.setState({ hasPermission: true });
    } else {
      this.setState({ hasPermission: false });
    }
  };
  render() {
    const { hasPermission, cameraType, smileDetected } = this.state;
    if (hasPermission === true) {
      return (
        <CenterView>
          <Camera
            style={{
              width: width - 40,
              height: height / 1.5,
              borderRadius: 10,
              overflow: "hidden",
            }}
            type={cameraType}
            onFacesDetected={smileDetected ? null : this.onFacesDetected}
            faceDetectorSettings={{
              detectLandmarks: FaceDetector.Constants.Landmarks.all,
              runClassifications: FaceDetector.Constants.Classifications.all,
            }}
            ref={this.cameraRef}
          />
          <IconBar>
            <TouchableOpacity onPress={this.switchCameraType}>
              <MaterialIcons
                name={
                  cameraType === Camera.Constants.Type.front
                    ? "camera-front"
                    : "camear-rear"
                }
                color="white"
                size={50}
              />
            </TouchableOpacity>
          </IconBar>
        </CenterView>
      );
    } else if (hasPermission === false) {
      return (
        <CenterView>
          <Text>Don't have permission for this</Text>
        </CenterView>
      );
    } else {
      return (
        <CenterView>
          <ActivityIndicator />
        </CenterView>
      );
    }
  }
  switchCameraType = () => {
    const { cameraType } = this.state;
    if (cameraType === Camera.Constants.Type.font) {
      this.setState({
        cameraType: Camera.Constants.Type.back,
      });
    } else {
      this.setState({
        cameraType: Camera.Constants.Type.font,
      });
    }
  };
  onFacesDetected = ({ faces }) => {
    const face = faces[0];
    if (face) {
      if (face.smilingProbability > 0.7) {
        this.setState({
          smileDetected: true,
        });
        this.takePhoto();
        console.log("take photo");
      }
    }
  };
  takePhoto = async () => {
    try {
      if (this.cameraRef.current) {
        let { uri } = await this.cameraRef.current.takePictureAsync({
          quality: 1,
          exif: true,
        });
        if (uri) {
          this.savePhoto(uri);
        }
      }
    } catch (e) {
      alert(e);
      this.setState({
        smileDetected: false,
      });
      console.log(e);
    }
  };
  savePhoto = async (uri) => {
    try {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status === "granted") {
        const asset = await MediaLibrary.createAssetAsync(uri);
        let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        if (album === null) {
          album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album.id);
        }
        setTimeout(() => this.setState({ smileDetected: false }), 2000);
      } else {
        this.setState({ hasPermission: false });
      }
    } catch (e) {
      console.log(e);
    }
  };
}
