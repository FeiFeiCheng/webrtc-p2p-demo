import { Form, Input, Button, message } from "antd";
import { useRef } from "react";

interface IProps {
  onJoinMeeting: (value: string) => void;
}

export default function Login(props: IProps) {
  const nameRef = useRef<any>(null);

  const onChange = (e: any) => {
    nameRef.current = e.target.value.trim();
  }
  const onJoinMeeting = () => {
    if (!nameRef.current) {
      message.info("请输入入会昵称!");

      return;
    }
    props.onJoinMeeting(nameRef.current);
  }

  return <div className="login-form">
    <p className="login-title">
      WebRTC 视频通话
    </p>
    <Form
      layout="vertical"
      onFinish={onJoinMeeting}
    >
      <Form.Item
        label="入会昵称"
        name="username"
      >
        <Input onChange={onChange} />
      </Form.Item>

      <Form.Item >
        <Button className="join-btn" size="large" type="primary" htmlType="submit">
          加入会议
        </Button>
      </Form.Item>
    </Form>
  </div>
}